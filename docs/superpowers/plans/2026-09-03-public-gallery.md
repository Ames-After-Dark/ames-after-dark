# Public Gallery Browsing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let anonymous website visitors browse Ames After Dark event photos by bar using bandwidth-cheap previews, with full-resolution single-photo download gated behind a logged-in account.

**Architecture:** Reuses the existing public `GET /api/r2/albums`/`GET /api/r2/photos` endpoints for listing (no changes to that data). Adds a new `gallery` backend resource with two endpoints: a public preview endpoint that lazily generates and caches a small JPEG thumbnail per photo (via `sharp`), and an authenticated download endpoint that signs the original file with a `Content-Disposition: attachment` header. Adds three new public routes to the existing admin-portal SPA (bar picker → album picker → photo grid), alongside the already-shipped `/photographers/:username` page.

**Tech Stack:** Node/Express/Prisma + `sharp` (new dependency) on the backend; React/Vite + `@auth0/auth0-react` (already a dependency) on the frontend.

**Spec:** `docs/superpowers/specs/2026-09-03-public-gallery-design.md`

## Global Constraints

- No bulk/zip download — one photo at a time, matching the spec's explicit scope decision.
- Anonymous browsing must never expose a full-resolution, directly-downloadable URL — only the preview (thumbnail) endpoint's output reaches unauthenticated visitors.
- The download endpoint requires a valid JWT **and** a matching row in `app.users` (any role) — a bare valid Auth0 token with no corresponding app account is not sufficient.
- Thumbnails are generated lazily on first public view and cached in R2 under a `thumb_`-prefixed key in the same folder as the original — no changes to the existing photo upload flow.
- `thumb_`-prefixed keys must never appear in `GET /api/r2/photos`'s listing or be selected as an album cover in `GET /api/r2/albums`, exactly like the existing `hidden_` convention.

---

## Task 1: Exclude `thumb_` keys from the existing photo/album listing endpoints

`backend/src/routes/r2Routes.js` already filters out `hidden_`-prefixed keys in two places (the album-cover-picking logic in `GET /albums`, and the photo list in `GET /photos`). Once Task 2 starts generating `thumb_`-prefixed cache files, both filters need to exclude those too, or a generated preview could show up as a "photo" in an album or even get picked as an album's cover image.

**Files:**
- Modify: `backend/src/routes/r2Routes.js`

**Interfaces:**
- No new interfaces — this task only changes filter logic in two existing route handlers.

- [ ] **Step 1: Update the filter in `GET /albums`**

Find this block inside the `router.get('/albums', ...)` handler:

```javascript
    for (const obj of allObjects) {
      const key = obj?.Key || '';

      // Ignore any photos that have been hidden by photographers
      if (key.includes('hidden_')) continue;
```

Replace with:

```javascript
    for (const obj of allObjects) {
      const key = obj?.Key || '';

      // Ignore any photos that have been hidden by photographers, or that
      // are cached preview thumbnails rather than real photos
      if (key.includes('hidden_') || key.includes('thumb_')) continue;
```

- [ ] **Step 2: Update the filter in `GET /photos`**

Find this block inside the `router.get('/photos', ...)` handler:

```javascript
    const imageObjs = objs.filter(o => {
      const key = o?.Key || '';

      // Ignore any photos that have been hidden by photographers
      if (key.includes('hidden_')) return false;

      const ext = key.toLowerCase().split('.').pop();
      return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  });
```

Replace with:

```javascript
    const imageObjs = objs.filter(o => {
      const key = o?.Key || '';

      // Ignore any photos that have been hidden by photographers, or that
      // are cached preview thumbnails rather than real photos
      if (key.includes('hidden_') || key.includes('thumb_')) return false;

      const ext = key.toLowerCase().split('.').pop();
      return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  });
```

- [ ] **Step 3: Manually verify no behavior changed**

There's no existing automated test coverage for `r2Routes.js` (matching this file's established pattern). Verify by running the dev backend and confirming the existing endpoints still behave identically:

```bash
cd backend && npm run start &
sleep 2
curl -s http://localhost:3001/api/r2/albums | head -c 300
curl -s "http://localhost:3001/api/r2/photos?prefix=Outlaws%2005-15/" | head -c 300
```

Expected: same JSON shapes as before (no `thumb_` files exist yet at this point in the plan, so the output should be identical to before this change — this step is just confirming the edit didn't break the existing filter logic). Stop the dev server afterward.

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/r2Routes.js
git commit -m "feat: exclude cached preview thumbnails from photo/album listings"
```

---

## Task 2: `galleryService.js` with unit tests

**Files:**
- Create: `backend/src/services/galleryService.js`
- Test: `backend/src/services/__tests__/galleryService.test.js`
- Modify: `backend/src/lib/r2Storage.js` (export `objectExists`, moved from `r2Routes.js`)
- Modify: `backend/src/routes/r2Routes.js` (import `objectExists` from `r2Storage.js` instead of defining it locally)
- Modify: `backend/package.json` (add `sharp` dependency)

**Interfaces:**
- Consumes: `s3`, `CLOUDFLARE_R2_BUCKET`, `signedUrlForKey` (all from `r2Storage.js`, already exist); the newly-exported `objectExists` (also from `r2Storage.js`, moved in this task).
- Produces (used by Task 3):
  - `isValidPhotoKey(key: string): boolean` — true only for a key shaped like `<folder>/<filename>.<jpg|jpeg|png|gif|webp>` with no `..`, exactly two path segments, and a filename that doesn't already start with `thumb_` or `hidden_`.
  - `getOrCreatePreviewUrl(key: string): Promise<string>` — returns a signed URL to a cached (or newly-generated) small preview image for the given original photo key.
  - `getDownloadUrl(key: string): Promise<string>` — returns a signed URL to the original file with a `Content-Disposition: attachment` header set.

- [ ] **Step 1: Move `objectExists` into `r2Storage.js` and export it**

`objectExists` currently lives as a private function in `r2Routes.js`, but Task 2's preview logic needs it too. This is a pure move (same rationale as the earlier extraction that created `r2Storage.js` in the first place) — no logic changes.

In `backend/src/lib/r2Storage.js`, add `HeadObjectCommand` to the existing `@aws-sdk/client-s3` import:

```javascript
const { S3Client, ListObjectsV2Command, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
```

Add this function (matching its exact current body from `r2Routes.js`, verbatim) after `signedUrlForKey`:

```javascript
/**
 * Check whether an object already exists at the given key.
 */
async function objectExists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: CLOUDFLARE_R2_BUCKET, Key: key }));
    return true;
  } catch (err) {
    if (err?.$metadata?.httpStatusCode === 404 || err?.name === 'NotFound') return false;
    throw err;
  }
}
```

Add `objectExists` to the `module.exports` object at the bottom of the file.

In `backend/src/routes/r2Routes.js`:
1. Remove the local `objectExists` function definition (the whole block, including its JSDoc comment):
   ```javascript
   /**
    * Check whether an object already exists at the given key.
    */
   async function objectExists(key) {
     try {
       await s3.send(new HeadObjectCommand({ Bucket: CLOUDFLARE_R2_BUCKET, Key: key }));
       return true;
     } catch (err) {
       if (err?.$metadata?.httpStatusCode === 404 || err?.name === 'NotFound') return false;
       throw err;
     }
   }
   ```
2. Add `objectExists` to the existing destructured import from `../lib/r2Storage`.
3. Remove `HeadObjectCommand` from `r2Routes.js`'s own `@aws-sdk/client-s3` import line (it's no longer used directly in this file — confirm by checking it isn't referenced anywhere else in `r2Routes.js` before removing).

- [ ] **Step 2: Add the `sharp` dependency**

```bash
cd backend && npm install sharp
```

Expected: `sharp` and its lockfile entries appear in `package.json`/`package-lock.json`. `sharp` ships prebuilt native bindings for standard Linux x64, matching this project's deployment target, so no extra system dependencies should be needed — but if `npm install` reports it's compiling from source or fails, stop and report BLOCKED rather than working around a native build issue.

- [ ] **Step 3: Write the failing tests**

```javascript
// backend/src/services/__tests__/galleryService.test.js
const mockR2Storage = {
    s3: { send: jest.fn() },
    CLOUDFLARE_R2_BUCKET: 'test-bucket',
    signedUrlForKey: jest.fn(),
    objectExists: jest.fn(),
};

jest.mock('../../lib/r2Storage', () => mockR2Storage);

const mockGetSignedUrl = jest.fn();
jest.mock('@aws-sdk/s3-request-presigner', () => ({
    getSignedUrl: (...args) => mockGetSignedUrl(...args),
}));

const mockSharpInstance = {
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn(),
};
jest.mock('sharp', () => jest.fn(() => mockSharpInstance));

const galleryService = require('../galleryService');

describe('galleryService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('isValidPhotoKey', () => {
        test('accepts a well-formed key', () => {
            expect(galleryService.isValidPhotoKey('Outlaws 09-06/_DSC1234.jpg')).toBe(true);
        });

        test('rejects a key containing ..', () => {
            expect(galleryService.isValidPhotoKey('../etc/passwd.jpg')).toBe(false);
        });

        test('rejects a key with the wrong number of path segments', () => {
            expect(galleryService.isValidPhotoKey('a/b/c.jpg')).toBe(false);
            expect(galleryService.isValidPhotoKey('c.jpg')).toBe(false);
        });

        test('rejects a disallowed extension', () => {
            expect(galleryService.isValidPhotoKey('Outlaws 09-06/notes.txt')).toBe(false);
        });

        test('rejects a key whose filename is already a thumb_ or hidden_ file', () => {
            expect(galleryService.isValidPhotoKey('Outlaws 09-06/thumb__DSC1234.jpg')).toBe(false);
            expect(galleryService.isValidPhotoKey('Outlaws 09-06/hidden__DSC1234.jpg')).toBe(false);
        });
    });

    describe('getOrCreatePreviewUrl', () => {
        test('returns the existing thumbnail URL without regenerating it', async () => {
            mockR2Storage.objectExists.mockResolvedValue(true);
            mockR2Storage.signedUrlForKey.mockResolvedValue('https://example.com/thumb.jpg');

            const url = await galleryService.getOrCreatePreviewUrl('Outlaws 09-06/_DSC1.jpg');

            expect(mockR2Storage.objectExists).toHaveBeenCalledWith('Outlaws 09-06/thumb__DSC1.jpg');
            expect(mockR2Storage.s3.send).not.toHaveBeenCalled();
            expect(mockR2Storage.signedUrlForKey).toHaveBeenCalledWith('Outlaws 09-06/thumb__DSC1.jpg');
            expect(url).toBe('https://example.com/thumb.jpg');
        });

        test('downloads, resizes, and uploads a new thumbnail when none exists yet', async () => {
            mockR2Storage.objectExists.mockResolvedValue(false);
            mockR2Storage.s3.send
                .mockResolvedValueOnce({ Body: (async function* () { yield Buffer.from('original-bytes'); })() })
                .mockResolvedValueOnce({});
            mockSharpInstance.toBuffer.mockResolvedValue(Buffer.from('resized-bytes'));
            mockR2Storage.signedUrlForKey.mockResolvedValue('https://example.com/thumb.jpg');

            const url = await galleryService.getOrCreatePreviewUrl('Outlaws 09-06/_DSC1.jpg');

            expect(mockR2Storage.s3.send).toHaveBeenCalledTimes(2);
            const getCall = mockR2Storage.s3.send.mock.calls[0][0];
            expect(getCall.input).toMatchObject({ Bucket: 'test-bucket', Key: 'Outlaws 09-06/_DSC1.jpg' });

            expect(mockSharpInstance.resize).toHaveBeenCalledWith({ width: 700, withoutEnlargement: true });
            expect(mockSharpInstance.jpeg).toHaveBeenCalledWith({ quality: 70 });

            const putCall = mockR2Storage.s3.send.mock.calls[1][0];
            expect(putCall.input).toMatchObject({
                Bucket: 'test-bucket',
                Key: 'Outlaws 09-06/thumb__DSC1.jpg',
                ContentType: 'image/jpeg',
            });
            expect(putCall.input.Body).toEqual(Buffer.from('resized-bytes'));

            expect(url).toBe('https://example.com/thumb.jpg');
        });
    });

    describe('getDownloadUrl', () => {
        test('signs the original key with an attachment content-disposition', async () => {
            mockGetSignedUrl.mockResolvedValue('https://example.com/original.jpg');

            const url = await galleryService.getDownloadUrl('Outlaws 09-06/_DSC1.jpg');

            expect(mockGetSignedUrl).toHaveBeenCalled();
            const [, command] = mockGetSignedUrl.mock.calls[0];
            expect(command.input).toMatchObject({
                Bucket: 'test-bucket',
                Key: 'Outlaws 09-06/_DSC1.jpg',
                ResponseContentDisposition: 'attachment; filename="_DSC1.jpg"',
            });
            expect(url).toBe('https://example.com/original.jpg');
        });
    });
});
```

- [ ] **Step 4: Run the tests to verify they fail**

```bash
cd backend && npx jest src/services/__tests__/galleryService.test.js
```

Expected: FAIL — `Cannot find module '../galleryService'`.

- [ ] **Step 5: Implement `galleryService.js`**

```javascript
// backend/src/services/galleryService.js
const { GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const sharp = require('sharp');
const { s3, CLOUDFLARE_R2_BUCKET, signedUrlForKey, objectExists } = require('../lib/r2Storage');

const PREVIEW_MAX_WIDTH = 700;
const PREVIEW_JPEG_QUALITY = 70;
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

function deriveThumbKey(key) {
  const parts = key.split('/');
  const filename = parts.pop();
  const folder = parts.join('/');
  return `${folder}/thumb_${filename}`;
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

exports.isValidPhotoKey = (key) => {
  if (typeof key !== 'string' || key.includes('..')) return false;

  const parts = key.split('/');
  if (parts.length !== 2) return false;

  const [folder, filename] = parts;
  if (!folder || !filename) return false;
  if (filename.startsWith('thumb_') || filename.startsWith('hidden_')) return false;

  const ext = filename.toLowerCase().split('.').pop();
  return ALLOWED_EXTENSIONS.includes(ext);
};

exports.getOrCreatePreviewUrl = async (key) => {
  const thumbKey = deriveThumbKey(key);

  if (await objectExists(thumbKey)) {
    return signedUrlForKey(thumbKey);
  }

  const original = await s3.send(new GetObjectCommand({ Bucket: CLOUDFLARE_R2_BUCKET, Key: key }));
  const buffer = await streamToBuffer(original.Body);
  const resized = await sharp(buffer)
    .resize({ width: PREVIEW_MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: PREVIEW_JPEG_QUALITY })
    .toBuffer();

  await s3.send(new PutObjectCommand({
    Bucket: CLOUDFLARE_R2_BUCKET,
    Key: thumbKey,
    Body: resized,
    ContentType: 'image/jpeg',
  }));

  return signedUrlForKey(thumbKey);
};

exports.getDownloadUrl = async (key) => {
  const filename = key.split('/').pop();
  const command = new GetObjectCommand({
    Bucket: CLOUDFLARE_R2_BUCKET,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${filename}"`,
  });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
};
```

- [ ] **Step 6: Run the tests to verify they pass**

```bash
cd backend && npx jest src/services/__tests__/galleryService.test.js
```

Expected: PASS, all 8 tests.

- [ ] **Step 7: Run the full suite to confirm the `objectExists` move didn't break `r2Routes.js`'s existing behavior**

```bash
cd backend && npx jest --testPathPatterns=src
```

Expected: PASS, same count as before this task (no test in the suite currently covers `r2Routes.js` directly, so this is mainly confirming nothing else broke).

- [ ] **Step 8: Manually verify the preview generation against the real dev database and R2 bucket**

```bash
cd backend && node index.js &
sleep 2
curl -s "http://localhost:3001/api/r2/photos?prefix=Outlaws%2005-15/" | head -c 500
```

Note one real photo key from that output (there should be a fixture album here from earlier work — e.g. `Outlaws 05-15/_DSC3298.jpg`). This step only exercises the listing endpoint — Task 3 wires the actual preview endpoint up to an HTTP route, so full end-to-end curl verification of `getOrCreatePreviewUrl` happens there. Stop the server (`pkill -f "node index.js"`) once done.

- [ ] **Step 9: Commit**

```bash
git add backend/src/lib/r2Storage.js backend/src/routes/r2Routes.js backend/src/services/galleryService.js backend/src/services/__tests__/galleryService.test.js backend/package.json backend/package-lock.json
git commit -m "feat: add galleryService with lazy thumbnail generation and gated download URLs"
```

---

## Task 3: `galleryController.js` + `galleryRoutes.js`, mounted at `/api/gallery`

**Files:**
- Create: `backend/src/controllers/galleryController.js`
- Create: `backend/src/routes/galleryRoutes.js`
- Test: `backend/src/controllers/__tests__/galleryController.test.js`
- Modify: `backend/index.js` (mount the new router)

**Interfaces:**
- Consumes: `galleryService.isValidPhotoKey`, `galleryService.getOrCreatePreviewUrl`, `galleryService.getDownloadUrl` (Task 2); `userService.getUserRolesByAuth0Id` (existing); `checkJwt` (existing `authMiddleware`).
- Produces (consumed by the frontend in Task 6):
  - `GET /api/gallery/preview?key=<key>` → **302 redirect** to a signed preview-image URL, or 400 for an invalid/missing key. No authentication. This is a redirect (not a JSON response) specifically so it can be used directly as an `<img src>` with no extra JavaScript fetch step.
  - `GET /api/gallery/download?key=<key>` (auth required) → 200 `{ url }` (a signed URL to the original file with a download-triggering header), 401 with no JWT or no matching `users` row, 400 for an invalid/missing key.

- [ ] **Step 1: Write `galleryController.js`**

```javascript
// backend/src/controllers/galleryController.js
const galleryService = require('../services/galleryService');
const userService = require('../services/userService');

// GET /api/gallery/preview?key=...
exports.getPreview = async (req, res) => {
  try {
    const key = req.query.key;
    if (!galleryService.isValidPhotoKey(key)) {
      return res.status(400).json({ error: 'Invalid or missing key' });
    }

    const url = await galleryService.getOrCreatePreviewUrl(key);
    res.redirect(url);
  } catch (err) {
    console.error('Error generating preview:', err);
    res.status(500).json({ error: 'Failed to generate preview' });
  }
};

// GET /api/gallery/download?key=...
exports.getDownload = async (req, res) => {
  try {
    const authId = req.auth?.payload?.sub;
    if (!authId) return res.status(401).json({ error: 'Unauthorized' });

    const userRoles = await userService.getUserRolesByAuth0Id(authId);
    if (!userRoles) return res.status(401).json({ error: 'Unauthorized: no matching account' });

    const key = req.query.key;
    if (!galleryService.isValidPhotoKey(key)) {
      return res.status(400).json({ error: 'Invalid or missing key' });
    }

    const url = await galleryService.getDownloadUrl(key);
    res.json({ url });
  } catch (err) {
    console.error('Error generating download URL:', err);
    res.status(500).json({ error: 'Failed to generate download URL' });
  }
};
```

- [ ] **Step 2: Write `galleryRoutes.js`**

```javascript
// backend/src/routes/galleryRoutes.js
const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');
const { checkJwt } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Gallery
 *     description: Public photo gallery browsing with bandwidth-conscious previews and login-gated downloads
 */

/**
 * @swagger
 * /api/gallery/preview:
 *   get:
 *     summary: Get a bandwidth-cheap preview image for a photo
 *     description: Redirects to a small cached preview image, generating and caching one on first request if it doesn't exist yet. No authentication required. Intended for direct use as an <img> src.
 *     tags: [Gallery]
 *     parameters:
 *       - name: key
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: The R2 object key of the original photo
 *     responses:
 *       302:
 *         description: Redirect to the signed preview image URL
 *       400:
 *         description: Invalid or missing key
 */
router.get('/preview', galleryController.getPreview);

/**
 * @swagger
 * /api/gallery/download:
 *   get:
 *     summary: Get a full-resolution download URL for a photo
 *     description: Requires a logged-in account (any role). Returns a signed URL with a Content-Disposition header that triggers a file download.
 *     tags: [Gallery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: key
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Download URL generated
 *       400:
 *         description: Invalid or missing key
 *       401:
 *         description: Unauthorized
 */
router.get('/download', checkJwt, galleryController.getDownload);

module.exports = router;
```

- [ ] **Step 3: Mount the router in `backend/index.js`**

Add alongside the other route requires/mounts:

```javascript
const galleryRoutes = require('./src/routes/galleryRoutes');
// ...
app.use('/api/gallery', galleryRoutes);
```

- [ ] **Step 4: Write the failing controller tests**

```javascript
// backend/src/controllers/__tests__/galleryController.test.js
jest.mock('../../services/galleryService');
jest.mock('../../services/userService');

const galleryService = require('../../services/galleryService');
const userService = require('../../services/userService');
const galleryController = require('../galleryController');

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.redirect = jest.fn().mockReturnValue(res);
    return res;
}

describe('galleryController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getPreview', () => {
        test('returns 400 for an invalid key', async () => {
            galleryService.isValidPhotoKey.mockReturnValue(false);
            const req = { query: { key: '../etc/passwd' } };
            const res = mockRes();

            await galleryController.getPreview(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(galleryService.getOrCreatePreviewUrl).not.toHaveBeenCalled();
        });

        test('redirects to the preview url for a valid key', async () => {
            galleryService.isValidPhotoKey.mockReturnValue(true);
            galleryService.getOrCreatePreviewUrl.mockResolvedValue('https://example.com/thumb.jpg');
            const req = { query: { key: 'Outlaws 09-06/_DSC1.jpg' } };
            const res = mockRes();

            await galleryController.getPreview(req, res);

            expect(galleryService.getOrCreatePreviewUrl).toHaveBeenCalledWith('Outlaws 09-06/_DSC1.jpg');
            expect(res.redirect).toHaveBeenCalledWith('https://example.com/thumb.jpg');
        });
    });

    describe('getDownload', () => {
        test('returns 401 with no auth', async () => {
            const req = { auth: {}, query: { key: 'x/y.jpg' } };
            const res = mockRes();

            await galleryController.getDownload(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        test('returns 401 when the JWT has no matching users row', async () => {
            userService.getUserRolesByAuth0Id.mockResolvedValue(null);
            const req = { auth: { payload: { sub: 'auth0|123' } }, query: { key: 'x/y.jpg' } };
            const res = mockRes();

            await galleryController.getDownload(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        test('returns 400 for an invalid key even when authenticated', async () => {
            userService.getUserRolesByAuth0Id.mockResolvedValue({ id: 1 });
            galleryService.isValidPhotoKey.mockReturnValue(false);
            const req = { auth: { payload: { sub: 'auth0|123' } }, query: { key: '../x' } };
            const res = mockRes();

            await galleryController.getDownload(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('returns the download url for a valid authenticated request', async () => {
            userService.getUserRolesByAuth0Id.mockResolvedValue({ id: 1 });
            galleryService.isValidPhotoKey.mockReturnValue(true);
            galleryService.getDownloadUrl.mockResolvedValue('https://example.com/original.jpg');
            const req = { auth: { payload: { sub: 'auth0|123' } }, query: { key: 'Outlaws 09-06/_DSC1.jpg' } };
            const res = mockRes();

            await galleryController.getDownload(req, res);

            expect(galleryService.getDownloadUrl).toHaveBeenCalledWith('Outlaws 09-06/_DSC1.jpg');
            expect(res.json).toHaveBeenCalledWith({ url: 'https://example.com/original.jpg' });
        });
    });
});
```

- [ ] **Step 5: Run the tests to verify they fail**

```bash
cd backend && npx jest src/controllers/__tests__/galleryController.test.js
```

Expected: FAIL — `Cannot find module '../galleryController'`.

- [ ] **Step 6: Run the tests to verify they pass**

(The implementation was already written in Steps 1-3.)

```bash
cd backend && npx jest src/controllers/__tests__/galleryController.test.js
```

Expected: PASS, all 6 tests.

- [ ] **Step 7: Manually verify the public preview endpoint end-to-end against the real dev server**

```bash
cd backend && node index.js &
sleep 2
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3001/api/gallery/preview?key=Outlaws%2005-15/_DSC3298.jpg"
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3001/api/gallery/preview?key=../etc/passwd"
```

Expected: first call returns `302` (curl follows redirects by default only with `-L`; without `-L` you should see `302`, confirming the redirect fires without error). Second call returns `400`. Then confirm a thumbnail was actually cached:

```bash
curl -s "http://localhost:3001/api/r2/photos?prefix=Outlaws%2005-15/" | grep -o "thumb_" || echo "correctly not listed"
```

Expected: `correctly not listed` — the generated `thumb_` file exists in R2 (the first curl succeeded) but Task 1's filter correctly excludes it from the photo listing. Stop the server afterward.

Authenticated `download` endpoint verification: there's no practical way to mint a real Auth0 bearer token in this environment. Confidence here comes from the unit tests above (Step 6) plus the task reviewer's code-level scrutiny — don't attempt to curl this endpoint with a fake/bypassed token.

- [ ] **Step 8: Commit**

```bash
git add backend/src/controllers/galleryController.js backend/src/routes/galleryRoutes.js backend/src/controllers/__tests__/galleryController.test.js backend/index.js
git commit -m "feat: add public preview and gated download API for the photo gallery"
```

---

## Task 4: Public page — `pages/GalleryBars.jsx` (bar picker)

**Files:**
- Create: `ames-after-dark-admin-portal/site/src/pages/GalleryBars.jsx`
- Modify: `ames-after-dark-admin-portal/site/src/App.jsx` (add the route)

**Interfaces:**
- Consumes: `GET /api/locations` (existing, public — returns an array of `{ id, name, ... }`).
- Produces: the `/gallery` route, linking to `/gallery/:barName` (consumed by Task 5).

- [ ] **Step 1: Write `GalleryBars.jsx`**

```jsx
// ames-after-dark-admin-portal/site/src/pages/GalleryBars.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../api/config';

export default function GalleryBars() {
    const [bars, setBars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const response = await fetch(`${API_BASE}/api/locations`);
                if (!response.ok) throw new Error(`Locations API failed: ${response.status}`);
                const data = await response.json();
                if (!cancelled) setBars(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Failed to load bars:', err);
                if (!cancelled) setError('Failed to load bars. Please try again.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, []);

    return (
        <div className="a-shell">
            <header className="a-header">
                <div className="a-container a-header__inner">
                    <Link className="a-brand" to="/" aria-label="Ames After Dark Home">
                        <img
                            className="a-brand__logo"
                            src="/assets/topBar.png"
                            alt="Ames After Dark"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    </Link>
                </div>
            </header>

            <main className="a-main">
                <div className="a-container">
                    <h1 className="a-h1">Browse Photos</h1>
                    <p className="a-sub">Pick a bar to see its event photos.</p>

                    {loading && (
                        <div className="a-loading" role="status" aria-live="polite">
                            <span className="a-spinner" aria-hidden="true"></span>
                            <span>Loading...</span>
                        </div>
                    )}

                    {!loading && error && <p className="a-error">{error}</p>}

                    {!loading && !error && bars.length === 0 && (
                        <div className="a-empty">No bars found.</div>
                    )}

                    {!loading && !error && bars.length > 0 && (
                        <div className="a-photogrid" role="list">
                            {bars.map((bar) => (
                                <Link
                                    key={bar.id}
                                    className="a-photocard"
                                    to={`/gallery/${encodeURIComponent(bar.name)}`}
                                    role="listitem"
                                >
                                    <div className="a-photocard__body">
                                        <h3 className="a-photocard__title">{bar.name}</h3>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
```

- [ ] **Step 2: Add the route in `App.jsx`**

Add the import near the other page imports:

```jsx
import GalleryBars from './pages/GalleryBars.jsx'
```

Add the route inside the top-level (public, outside `RoleProvider`) `<Routes>` block, alongside `/photographers/:username`:

```jsx
<Route path="/gallery" element={<GalleryBars />} />
```

- [ ] **Step 3: Manually verify in a browser**

```bash
cd site && npm run dev
```

Visit `http://localhost:5173/gallery` while logged out. Expected: the page loads without requiring login and shows a card per bar. (If `VITE_API_BASE` isn't set, this hits production — set `VITE_API_BASE=http://localhost:3001` in a local `.env.local`, gitignored, and run the backend locally too, matching how earlier tasks in this project verified frontend changes against a local backend.)

- [ ] **Step 4: Commit**

```bash
git add site/src/pages/GalleryBars.jsx site/src/App.jsx
git commit -m "feat: add public gallery bar picker page"
```

---

## Task 5: Public page — `pages/GalleryAlbums.jsx` (album picker)

**Files:**
- Create: `ames-after-dark-admin-portal/site/src/pages/GalleryAlbums.jsx`
- Modify: `ames-after-dark-admin-portal/site/src/App.jsx` (add the route)

**Interfaces:**
- Consumes: `GET /api/r2/albums` (existing, public).
- Produces: the `/gallery/:barName` route, linking to `/gallery/:barName/:albumId` (consumed by Task 6). `:albumId` is `encodeURIComponent(album.albumUri)` with its trailing slash stripped.

- [ ] **Step 1: Write `GalleryAlbums.jsx`**

```jsx
// ames-after-dark-admin-portal/site/src/pages/GalleryAlbums.jsx
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { API_BASE } from '../api/config';

// Loosely match an R2 album's free-typed bar name against the canonical
// bar name from the route param - mirrors the backend's matcher.
function normalizeBarName(name) {
    return String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}
function barNamesMatch(a, b) {
    const na = normalizeBarName(a);
    const nb = normalizeBarName(b);
    if (!na || !nb) return false;
    return na.startsWith(nb) || nb.startsWith(na);
}

export default function GalleryAlbums() {
    const { barName } = useParams();
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const response = await fetch(`${API_BASE}/api/r2/albums`);
                if (!response.ok) throw new Error(`Albums API failed: ${response.status}`);
                const data = await response.json();
                const all = Array.isArray(data) ? data : [];
                if (!cancelled) setAlbums(all.filter((a) => barNamesMatch(a.barName, barName)));
            } catch (err) {
                console.error('Failed to load albums:', err);
                if (!cancelled) setError('Failed to load albums. Please try again.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [barName]);

    return (
        <div className="a-shell">
            <header className="a-header">
                <div className="a-container a-header__inner">
                    <Link className="a-brand" to="/" aria-label="Ames After Dark Home">
                        <img
                            className="a-brand__logo"
                            src="/assets/topBar.png"
                            alt="Ames After Dark"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    </Link>
                </div>
            </header>

            <main className="a-main">
                <div className="a-container">
                    <Link className="a-btn a-btn--ghost" to="/gallery">Back to bars</Link>
                    <h1 className="a-h1">{barName}</h1>

                    {loading && (
                        <div className="a-loading" role="status" aria-live="polite">
                            <span className="a-spinner" aria-hidden="true"></span>
                            <span>Loading...</span>
                        </div>
                    )}

                    {!loading && error && <p className="a-error">{error}</p>}

                    {!loading && !error && albums.length === 0 && (
                        <div className="a-empty">No albums for this bar yet.</div>
                    )}

                    {!loading && !error && albums.length > 0 && (
                        <div className="a-photogrid" role="list">
                            {albums.map((album) => (
                                <Link
                                    key={album.albumUri}
                                    className="a-photocard"
                                    to={`/gallery/${encodeURIComponent(barName)}/${encodeURIComponent(album.albumUri.replace(/\/$/, ''))}`}
                                    role="listitem"
                                >
                                    {album.coverUrl && (
                                        <img className="a-photocard__cover" src={album.coverUrl} alt={album.name} loading="lazy" />
                                    )}
                                    <div className="a-photocard__body">
                                        <h3 className="a-photocard__title">{album.name}</h3>
                                        <p className="a-photocard__date">{album.date}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
```

- [ ] **Step 2: Add the route in `App.jsx`**

Add the import:

```jsx
import GalleryAlbums from './pages/GalleryAlbums.jsx'
```

Add the route, alongside `/gallery`:

```jsx
<Route path="/gallery/:barName" element={<GalleryAlbums />} />
```

- [ ] **Step 3: Manually verify in a browser**

With the dev server(s) still running from Task 4, visit `http://localhost:5173/gallery/Outlaws` (or whichever bar has the test fixture album from earlier work). Expected: shows that bar's albums with full-resolution cover images, "Back to bars" link works.

- [ ] **Step 4: Commit**

```bash
git add site/src/pages/GalleryAlbums.jsx site/src/App.jsx
git commit -m "feat: add public gallery album picker page"
```

---

## Task 6: Public page — `pages/GalleryPhotos.jsx` (photo grid, lightbox, gated download)

**Files:**
- Create: `ames-after-dark-admin-portal/site/src/pages/GalleryPhotos.jsx`
- Modify: `ames-after-dark-admin-portal/site/src/App.jsx` (add the route)

**Interfaces:**
- Consumes: `GET /api/r2/photos?prefix=...` (existing, public — this task only uses each entry's `id` field, not its `image.uri`), `GET /api/gallery/preview?key=...` (Task 3, used directly as an `<img src>`), `GET /api/gallery/download?key=...` (Task 3, called with a bearer token from `useAuth0().getAccessTokenSilently()`).

- [ ] **Step 1: Write `GalleryPhotos.jsx`**

```jsx
// ames-after-dark-admin-portal/site/src/pages/GalleryPhotos.jsx
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { API_BASE } from '../api/config';

export default function GalleryPhotos() {
    const { barName, albumId } = useParams();
    const { isAuthenticated, loginWithRedirect, getAccessTokenSilently } = useAuth0();

    const [photoKeys, setPhotoKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedKey, setSelectedKey] = useState(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const prefix = `${albumId}/`;
                const response = await fetch(`${API_BASE}/api/r2/photos?prefix=${encodeURIComponent(prefix)}`);
                if (!response.ok) throw new Error(`Photos API failed: ${response.status}`);
                const data = await response.json();
                const keys = Array.isArray(data) ? data.map((p) => p.id).filter(Boolean) : [];
                if (!cancelled) setPhotoKeys(keys);
            } catch (err) {
                console.error('Failed to load photos:', err);
                if (!cancelled) setError('Failed to load photos. Please try again.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [albumId]);

    const downloadPhoto = async (key) => {
        if (!isAuthenticated) {
            await loginWithRedirect({ appState: { returnTo: window.location.pathname } });
            return;
        }

        setDownloading(true);
        try {
            const token = await getAccessTokenSilently();
            const response = await fetch(`${API_BASE}/api/gallery/download?key=${encodeURIComponent(key)}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error(`Download API failed: ${response.status}`);
            const { url } = await response.json();
            window.location.href = url;
        } catch (err) {
            console.error('Failed to download photo:', err);
            alert('Failed to download this photo. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="a-shell">
            <header className="a-header">
                <div className="a-container a-header__inner">
                    <Link className="a-brand" to="/" aria-label="Ames After Dark Home">
                        <img
                            className="a-brand__logo"
                            src="/assets/topBar.png"
                            alt="Ames After Dark"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    </Link>
                </div>
            </header>

            <main className="a-main">
                <div className="a-container">
                    <Link className="a-btn a-btn--ghost" to={`/gallery/${encodeURIComponent(barName)}`}>Back to albums</Link>
                    <h1 className="a-h1">{barName}</h1>

                    {loading && (
                        <div className="a-loading" role="status" aria-live="polite">
                            <span className="a-spinner" aria-hidden="true"></span>
                            <span>Loading...</span>
                        </div>
                    )}

                    {!loading && error && <p className="a-error">{error}</p>}

                    {!loading && !error && photoKeys.length === 0 && (
                        <div className="a-empty">No photos found in this album.</div>
                    )}

                    {!loading && !error && photoKeys.length > 0 && (
                        <div className="a-thumbgrid">
                            {photoKeys.map((key) => (
                                <div key={key} className="a-thumbwrap">
                                    <button
                                        className="a-thumb"
                                        type="button"
                                        onClick={() => setSelectedKey(key)}
                                        style={{ border: 0, padding: 0, background: 'none', cursor: 'pointer' }}
                                    >
                                        <img src={`${API_BASE}/api/gallery/preview?key=${encodeURIComponent(key)}`} alt="Event capture" loading="lazy" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {selectedKey && (
                <div className="a-modal-back" onClick={(e) => e.target === e.currentTarget && setSelectedKey(null)}>
                    <div className="a-modal" role="dialog">
                        <div className="a-modal__top">
                            <div className="a-modal__title">Preview</div>
                            <button className="a-btn a-btn--ghost a-btn--icon" type="button" onClick={() => setSelectedKey(null)} aria-label="Close">
                                ✕
                            </button>
                        </div>
                        <div className="a-modal__body">
                            <img
                                src={`${API_BASE}/api/gallery/preview?key=${encodeURIComponent(selectedKey)}`}
                                alt="Event capture preview"
                                style={{ maxWidth: '100%', display: 'block' }}
                            />
                        </div>
                        <div className="a-modal__actions">
                            <button
                                className="a-btn a-btn--primary"
                                type="button"
                                onClick={() => downloadPhoto(selectedKey)}
                                disabled={downloading}
                            >
                                {downloading ? 'Preparing…' : (isAuthenticated ? 'Download' : 'Log in to download')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
```

- [ ] **Step 2: Add the route in `App.jsx`**

Add the import:

```jsx
import GalleryPhotos from './pages/GalleryPhotos.jsx'
```

Add the route, alongside `/gallery/:barName`:

```jsx
<Route path="/gallery/:barName/:albumId" element={<GalleryPhotos />} />
```

- [ ] **Step 3: Manually verify in a browser**

With the dev server(s) still running, visit an album's photo grid (e.g. `http://localhost:5173/gallery/Outlaws/Outlaws%2005-15`). Expected while logged out: the grid loads showing preview (smaller/lower-quality) images, not the originals; clicking a photo opens the lightbox with a "Log in to download" button; clicking it triggers an Auth0 login redirect. After logging in (with any real account — this can be verified with a real login in a browser, unlike the earlier photographer-pages feature's self-edit flow), clicking a photo's "Download" button in the lightbox should trigger a real file download of the full-resolution original.

Also verify the bandwidth claim directly: open the browser's Network tab, load an album with several photos, and confirm the images requested are the small `thumb_`-prefixed R2 objects (check the final redirected URL), not the full-resolution originals.

- [ ] **Step 4: Commit**

```bash
git add site/src/pages/GalleryPhotos.jsx site/src/App.jsx
git commit -m "feat: add public gallery photo grid with lightbox and gated download"
```
