# Photographer Personal Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give each photographer a public personal page (photo, bio, alternate links, and the albums they've shot), self-editable from the existing admin portal.

**Architecture:** Two new Postgres tables (`photo_albums` for album→photographer attribution, `photographer_links` for alt links) plus one new column (`users.photographer_photo_url`, storing an R2 object key). A new backend resource (`photographerService`/`photographerController`/`photographerRoutes`) serves a public read-only profile endpoint and an authenticated self-edit endpoint. Two small hooks added to the existing `r2Routes.js` album upload/delete endpoints keep `photo_albums` in sync going forward — no historical backfill. The admin portal gets one new public route (`/photographers/:username`) and one new self-edit component mounted into the existing Photographer page.

**Tech Stack:** Node/Express/Prisma (backend), React/Vite (admin portal), Jest for backend unit tests, Cloudflare R2 (S3-compatible) for image storage.

**Spec:** `docs/superpowers/specs/2026-09-02-photographer-pages-design.md`

## Global Constraints

- No historical backfill — `photo_albums` starts empty; only albums created from this point forward get attributed.
- `users.photographer_photo_url` stores an **R2 object key**, not a signed URL — it must always be signed on read (1-hour expiry), matching how every other R2-backed image in this codebase is served (never a stored/cached public URL).
- Self-edit endpoints operate on the caller's own row only — no "edit someone else's page" capability in this iteration.
- `photo_albums` attribution is written only when the uploader's role is `photographer` (admin/developer-created albums stay unattributed).
- Backend repo `ames-after-dark` works on branch `development`; frontend repo `ames-after-dark-admin-portal` works on branch `main` (its only branch). Commit locally after each task; do not push — pushing/deploying needs separate explicit go-ahead per standing project norms.

---

## Task 1: Extract shared R2 storage helpers into `src/lib/r2Storage.js`

`backend/src/routes/r2Routes.js` currently defines the S3 client and all its low-level helpers (signing, listing, folder/filename parsing) as private functions at the top of the file. The new photographer-profile feature needs several of these same helpers (to sign a profile-photo URL and to resolve album cover images), so they need to be reusable rather than duplicated. This is a pure move — no logic changes — so the existing R2 endpoints must keep working identically afterward.

**Files:**
- Create: `backend/src/lib/r2Storage.js`
- Modify: `backend/src/routes/r2Routes.js` (replace the extracted definitions with an import)

**Interfaces:**
- Produces (used by Task 4 and by `r2Routes.js`):
  - `s3` — configured `S3Client` instance
  - `CLOUDFLARE_R2_BUCKET` — string, the bucket name
  - `signedUrlForKey(key: string): Promise<string>`
  - `listR2Objects(prefix?: string): Promise<S3.Object[]>`
  - `parseFolderName(folderName: string): { displayName: string, dateStr: string|null }`
  - `parseDateStr(dateStr: string|null): Date|null`
  - `formatDateStr(dateStr: string|null): string|null`
  - `sanitizeFilename(filename: string, contentType: string): string|null`
  - `ALLOWED_UPLOAD_CONTENT_TYPES` — `{ [mimeType]: extension }`

- [ ] **Step 1: Create `backend/src/lib/r2Storage.js` with the moved code**

Move these exact definitions out of `backend/src/routes/r2Routes.js` verbatim (do not alter their bodies): the `ALLOWED_UPLOAD_CONTENT_TYPES` constant, the `S3Client`/`getSignedUrl` imports and env var reads, the `s3` client construction, and the functions `signedUrlForKey`, `listR2Objects`, `parseFolderName`, `parseDateStr`, `formatDateStr`, `sanitizeFilename`. Leave `sanitizeFolderName`, `objectExists`, `uniqueKeyFor`, `normalizeBarName`, `barNamesMatch`, and `allowedBarNamesFor`/`isFolderAllowed` in `r2Routes.js` — they're only used there.

```javascript
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const ALLOWED_UPLOAD_CONTENT_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const {
  CLOUDFLARE_R2_ACCESS_KEY_ID,
  CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  CLOUDFLARE_R2_BUCKET,
  CLOUDFLARE_R2_S3_ENDPOINT,
} = process.env;

const s3 = new S3Client({
  region: 'auto',
  endpoint: CLOUDFLARE_R2_S3_ENDPOINT,
  credentials: {
    accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Generate a signed URL for an R2 object key, valid for 1 hour.
 */
async function signedUrlForKey(key) {
  const command = new GetObjectCommand({
    Bucket: CLOUDFLARE_R2_BUCKET,
    Key: key,
  });
  return await getSignedUrl(s3, command, { expiresIn: 3600 });
}

/**
 * List objects in R2 with pagination to bypass 1000 object limit
 */
async function listR2Objects(prefix = '') {
  let isTruncated = true;
  let continuationToken = undefined;
  const allContents = [];

  try {
    while (isTruncated) {
      const command = new ListObjectsV2Command({
        Bucket: CLOUDFLARE_R2_BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      });

      const response = await s3.send(command);

      if (response.Contents) {
        allContents.push(...response.Contents);
      }

      isTruncated = response.IsTruncated;
      continuationToken = response.NextContinuationToken;
    }

    return allContents;
  } catch (err) {
    console.warn('R2 list error:', err);
    return [];
  }
}

/**
 * Parse a folder name into display name and date string.
 * If no date found, returns display name as-is and dateStr as null.
 */
function parseFolderName(folderName) {
  const cleaned = folderName.trim();
  const match = cleaned.match(/^(.+?)[\s_]+(\d{1,2}[-\/]\d{1,2}(?:[-\/]\d{2,4})?)$/);

  if (match) {
    const displayName = match[1].replace(/_+$/, '').trim();
    return { displayName, dateStr: match[2] };
  }

  return { displayName: cleaned, dateStr: null };
}

/**
 * Parse a date string like "03-12" into a Date object.
 * If date is in the future, roll back to previous year.
 */
function parseDateStr(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split(/[-\/]/);
  if (parts.length < 2) return null;

  const month = parseInt(parts[0], 10) - 1;
  const day = parseInt(parts[1], 10);
  if (isNaN(month) || isNaN(day)) return null;

  const now = new Date();
  let year = now.getFullYear();

  if (parts.length === 3) {
    const providedYear = parseInt(parts[2].trim(), 10);
    year = providedYear < 100 ? 2000 + providedYear : providedYear;
  }

  let candidate = new Date(year, month, day);
  if (candidate > now && parts.length !== 3) candidate = new Date(year - 1, month, day);

  return candidate;
}

/**
 * Format date string like "3-12" into "03/12" for display.
 */
function formatDateStr(dateStr) {
  if (!dateStr) return null;
  const [m, d] = dateStr.split('-');
  return `${m.padStart(2, '0')}/${d.padStart(2, '0')}`;
}

/**
 * Validate an uploaded filename: basename only (no path separators),
 * and its extension must match the declared content type.
 */
function sanitizeFilename(filename, contentType) {
  const base = String(filename || '').split(/[\\/]/).pop().trim();
  if (!base || base.includes('..')) return null;

  const expectedExt = ALLOWED_UPLOAD_CONTENT_TYPES[contentType];
  if (!expectedExt) return null;

  const actualExt = base.toLowerCase().split('.').pop();
  const jpgAliases = expectedExt === 'jpg' ? ['jpg', 'jpeg'] : [expectedExt];
  if (!jpgAliases.includes(actualExt)) return null;

  return base;
}

module.exports = {
  s3,
  CLOUDFLARE_R2_BUCKET,
  ALLOWED_UPLOAD_CONTENT_TYPES,
  signedUrlForKey,
  listR2Objects,
  parseFolderName,
  parseDateStr,
  formatDateStr,
  sanitizeFilename,
};
```

- [ ] **Step 2: Update `r2Routes.js` to import from the new module instead of defining locally**

Delete the moved definitions (and their now-duplicate imports/env reads) from `r2Routes.js`, and add near the top of the file (after the existing `require`s):

```javascript
const {
  s3,
  CLOUDFLARE_R2_BUCKET,
  ALLOWED_UPLOAD_CONTENT_TYPES,
  signedUrlForKey,
  listR2Objects,
  parseFolderName,
  parseDateStr,
  formatDateStr,
  sanitizeFilename,
} = require('../lib/r2Storage');
```

Remove the now-unused `S3Client`/`GetObjectCommand`/`getSignedUrl` imports from `r2Routes.js`'s top `require('@aws-sdk/client-s3')` line, keeping only the S3 command classes it still constructs directly (`ListObjectsV2Command` is now only used inside `r2Storage.js`, so drop it from `r2Routes.js`'s import too; keep `PutObjectCommand`, `HeadObjectCommand`, `CopyObjectCommand`, `DeleteObjectCommand`, which remain used directly in `r2Routes.js`).

- [ ] **Step 3: Manually verify no behavior changed**

There's no existing automated test coverage for `r2Routes.js`, so verify by running the dev backend and exercising the existing endpoints it did before:

```bash
cd backend && npm run start &
sleep 2
curl -s http://localhost:3001/api/r2/albums | head -c 300
```

Expected: same JSON shape as before the refactor (an array of album objects, or `[]`), no server errors in the console. Stop the dev server afterward.

- [ ] **Step 4: Commit**

```bash
git add backend/src/lib/r2Storage.js backend/src/routes/r2Routes.js
git commit -m "refactor: extract shared R2 storage helpers into src/lib/r2Storage.js"
```

---

## Task 2: Add the `photo_albums` / `photographer_links` tables and `users.photographer_photo_url` column

**Files:**
- Modify: `backend/prisma/schema.prisma`

**Interfaces:**
- Produces (used by Task 3): Prisma models `photo_albums` (fields `id`, `folder_name`, `location_id`, `photographer_id`, `created_at`) and `photographer_links` (fields `id`, `user_id`, `label`, `url`, `sort_order`), and `users.photographer_photo_url` (nullable string).

- [ ] **Step 1: Add the new models to `schema.prisma`**

Add after the `model location_admins { ... }` block:

```prisma
model photo_albums {
  id               Int       @id @default(autoincrement())
  folder_name      String    @unique @db.VarChar(255)
  location_id      Int
  photographer_id  Int
  created_at       DateTime  @default(now()) @db.Timestamptz(6)
  locations        locations @relation(fields: [location_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
  users            users     @relation(fields: [photographer_id], references: [id], onDelete: Cascade, onUpdate: NoAction)

  @@schema("app")
}

model photographer_links {
  id         Int    @id @default(autoincrement())
  user_id    Int
  label      String @db.VarChar(100)
  url        String @db.VarChar(512)
  sort_order Int    @default(0)
  users      users  @relation(fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction)

  @@schema("app")
}
```

- [ ] **Step 2: Add the back-relations and new column, following this schema's existing convention of declaring both sides of every relation**

In `model users { ... }`, add two back-relation fields (alongside the existing `location_admins location_admins[]` line) and the new column (alongside the existing `bio` column):

```prisma
  photo_albums          photo_albums[]
  photographer_links    photographer_links[]
  photographer_photo_url String? @db.VarChar(512)
```

In `model locations { ... }`, add one back-relation field (alongside the existing `location_admins location_admins[]` line):

```prisma
  photo_albums photo_albums[]
```

- [ ] **Step 3: Generate and apply the migration against the dev database**

```bash
cd backend && npx prisma migrate dev --name add_photographer_pages
```

Expected: Prisma prints a new migration under `prisma/migrations/`, applies it to `ames_after_dark_dev`, and regenerates the client with no errors.

- [ ] **Step 4: Verify the schema landed correctly**

```bash
ssh oracle "sudo -u postgres psql -d ames_after_dark_dev -c '\d app.photo_albums' -c '\d app.photographer_links' -c '\d app.users' | grep -A2 photographer_photo_url"
```

Expected: both new tables exist with the columns/FKs above, and `users` shows the new `photographer_photo_url` column.

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations
git commit -m "feat: add photo_albums, photographer_links tables and users.photographer_photo_url column"
```

---

## Task 3: `photographerService.js` with unit tests

**Files:**
- Create: `backend/src/services/photographerService.js`
- Test: `backend/src/services/__tests__/photographerService.test.js`

**Interfaces:**
- Consumes: Prisma models from Task 2 (`prisma.photo_albums`, `prisma.photographer_links`, `prisma.users`).
- Produces (used by Task 4 and Task 5):
  - `recordAlbumIfNew({ folderName, locationId, photographerId }): Promise<object|null>` — creates a `photo_albums` row if none exists for `folderName`; returns the created row, or `null` if one already existed (no-op).
  - `deleteAlbumRecord(folderName): Promise<void>` — deletes the `photo_albums` row for `folderName` if present; no-op if absent.
  - `getPublicProfileByUsername(username): Promise<{ id, username, name, bio, photoKey, links: [{label, url}], albums: [{folderName, locationId, barName}] }|null>` — `null` if no such user or the user's role isn't `photographer`.
  - `getMyProfile(userId): Promise<{ bio, photoKey, links: [{label, url}] }>`
  - `updateMyProfile(userId, { bio, links }): Promise<void>` — sets `users.bio`, deletes all existing `photographer_links` for `userId`, and inserts the given `links` in order (`sort_order` = array index). (Task 4 extends this signature to also accept an optional `photoKey` — see Task 4 Step 1.)

- [ ] **Step 1: Write the failing tests**

```javascript
// backend/src/services/__tests__/photographerService.test.js
const mockPrisma = {
    photo_albums: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
    },
    photographer_links: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
    },
    users: {
        findUnique: jest.fn(),
        update: jest.fn(),
    },
};

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => mockPrisma),
}));

const photographerService = require('../photographerService');

describe('photographerService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('recordAlbumIfNew', () => {
        test('creates a photo_albums row when none exists yet', async () => {
            mockPrisma.photo_albums.findUnique.mockResolvedValue(null);
            const created = { id: 1, folder_name: 'Outlaws 09-06', location_id: 9, photographer_id: 87 };
            mockPrisma.photo_albums.create.mockResolvedValue(created);

            const result = await photographerService.recordAlbumIfNew({
                folderName: 'Outlaws 09-06',
                locationId: 9,
                photographerId: 87,
            });

            expect(mockPrisma.photo_albums.create).toHaveBeenCalledWith({
                data: { folder_name: 'Outlaws 09-06', location_id: 9, photographer_id: 87 },
            });
            expect(result).toBe(created);
        });

        test('does nothing when a row already exists for that folder', async () => {
            mockPrisma.photo_albums.findUnique.mockResolvedValue({ id: 1, folder_name: 'Outlaws 09-06' });

            const result = await photographerService.recordAlbumIfNew({
                folderName: 'Outlaws 09-06',
                locationId: 9,
                photographerId: 87,
            });

            expect(mockPrisma.photo_albums.create).not.toHaveBeenCalled();
            expect(result).toBeNull();
        });
    });

    describe('deleteAlbumRecord', () => {
        test('deletes the row for the given folder name', async () => {
            await photographerService.deleteAlbumRecord('Outlaws 09-06');

            expect(mockPrisma.photo_albums.delete).toHaveBeenCalledWith({
                where: { folder_name: 'Outlaws 09-06' },
            });
        });

        test('swallows the error when no row exists for that folder', async () => {
            mockPrisma.photo_albums.delete.mockRejectedValue({ code: 'P2025' });

            await expect(photographerService.deleteAlbumRecord('nope')).resolves.toBeUndefined();
        });
    });

    describe('getPublicProfileByUsername', () => {
        test('returns null when no user has that username', async () => {
            mockPrisma.users.findUnique.mockResolvedValue(null);

            const result = await photographerService.getPublicProfileByUsername('nobody');

            expect(result).toBeNull();
        });

        test('returns null when the user is not a photographer', async () => {
            mockPrisma.users.findUnique.mockResolvedValue({
                id: 1, username: 'bob', roles: { name: 'admin' },
            });

            const result = await photographerService.getPublicProfileByUsername('bob');

            expect(result).toBeNull();
        });

        test('returns the profile shape for a photographer', async () => {
            mockPrisma.users.findUnique.mockResolvedValue({
                id: 87,
                username: 'kirstyn',
                name: 'Kirstyn Henningsen',
                bio: 'Nightlife photographer.',
                photographer_photo_url: 'photographer-photos/87.jpg',
                roles: { name: 'photographer' },
                photographer_links: [{ label: 'Instagram', url: 'https://instagram.com/kirstyn' }],
                photo_albums: [
                    { folder_name: 'Outlaws 09-06', location_id: 9, locations: { name: 'Outlaws' } },
                ],
            });

            const result = await photographerService.getPublicProfileByUsername('kirstyn');

            expect(result).toEqual({
                id: 87,
                username: 'kirstyn',
                name: 'Kirstyn Henningsen',
                bio: 'Nightlife photographer.',
                photoKey: 'photographer-photos/87.jpg',
                links: [{ label: 'Instagram', url: 'https://instagram.com/kirstyn' }],
                albums: [{ folderName: 'Outlaws 09-06', locationId: 9, barName: 'Outlaws' }],
            });
        });
    });

    describe('updateMyProfile', () => {
        test('updates bio and replaces links in order', async () => {
            await photographerService.updateMyProfile(87, {
                bio: 'New bio',
                links: [{ label: 'Instagram', url: 'https://instagram.com/a' }, { label: 'SmugMug', url: 'https://smugmug.com/b' }],
            });

            expect(mockPrisma.users.update).toHaveBeenCalledWith({
                where: { id: 87 },
                data: { bio: 'New bio' },
            });
            expect(mockPrisma.photographer_links.deleteMany).toHaveBeenCalledWith({ where: { user_id: 87 } });
            expect(mockPrisma.photographer_links.createMany).toHaveBeenCalledWith({
                data: [
                    { user_id: 87, label: 'Instagram', url: 'https://instagram.com/a', sort_order: 0 },
                    { user_id: 87, label: 'SmugMug', url: 'https://smugmug.com/b', sort_order: 1 },
                ],
            });
        });
    });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd backend && npx jest src/services/__tests__/photographerService.test.js
```

Expected: FAIL — `Cannot find module '../photographerService'`.

- [ ] **Step 3: Implement `photographerService.js`**

```javascript
// backend/src/services/photographerService.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.recordAlbumIfNew = async ({ folderName, locationId, photographerId }) => {
  const existing = await prisma.photo_albums.findUnique({ where: { folder_name: folderName } });
  if (existing) return null;

  return prisma.photo_albums.create({
    data: { folder_name: folderName, location_id: locationId, photographer_id: photographerId },
  });
};

exports.deleteAlbumRecord = async (folderName) => {
  try {
    await prisma.photo_albums.delete({ where: { folder_name: folderName } });
  } catch (err) {
    if (err.code !== 'P2025') throw err; // P2025 = record not found, safe no-op
  }
};

exports.getPublicProfileByUsername = async (username) => {
  const user = await prisma.users.findUnique({
    where: { username },
    include: {
      roles: true,
      photographer_links: { orderBy: { sort_order: 'asc' }, select: { label: true, url: true } },
      photo_albums: { select: { folder_name: true, location_id: true, locations: { select: { name: true } } } },
    },
  });

  if (!user || user.roles?.name?.toLowerCase() !== 'photographer') return null;

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    bio: user.bio,
    photoKey: user.photographer_photo_url,
    links: user.photographer_links,
    albums: user.photo_albums.map((a) => ({
      folderName: a.folder_name,
      locationId: a.location_id,
      barName: a.locations.name,
    })),
  };
};

exports.getMyProfile = async (userId) => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: { photographer_links: { orderBy: { sort_order: 'asc' }, select: { label: true, url: true } } },
  });

  return {
    bio: user.bio,
    photoKey: user.photographer_photo_url,
    links: user.photographer_links,
  };
};

exports.updateMyProfile = async (userId, { bio, links }) => {
  await prisma.users.update({ where: { id: userId }, data: { bio } });
  await prisma.photographer_links.deleteMany({ where: { user_id: userId } });
  if (links.length > 0) {
    await prisma.photographer_links.createMany({
      data: links.map((link, i) => ({ user_id: userId, label: link.label, url: link.url, sort_order: i })),
    });
  }
};

```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
cd backend && npx jest src/services/__tests__/photographerService.test.js
```

Expected: PASS, all 8 tests.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/photographerService.js backend/src/services/__tests__/photographerService.test.js
git commit -m "feat: add photographerService with album attribution and profile CRUD"
```

---

## Task 4: `photographerController.js` + `photographerRoutes.js`, mounted at `/api/photographers`

**Files:**
- Create: `backend/src/controllers/photographerController.js`
- Create: `backend/src/routes/photographerRoutes.js`
- Modify: `backend/index.js` (mount the new router)

**Interfaces:**
- Consumes: `photographerService` (Task 3), `r2Storage` (Task 1: `signedUrlForKey`, `listR2Objects`, `parseFolderName`, `parseDateStr`, `formatDateStr`, `ALLOWED_UPLOAD_CONTENT_TYPES`, `sanitizeFilename`, `s3`, `CLOUDFLARE_R2_BUCKET`), `userService.getUserRolesByAuth0Id` (existing), `checkJwt` (existing `authMiddleware`).
- Produces (public HTTP surface, consumed by the frontend in Tasks 6-7):
  - `GET /api/photographers/:username` → 200 `{ name, bio, photoUrl, links, albums: [{ folder, barName, date, coverUrl }] }` or 404.
  - `GET /api/photographers/me` (auth) → 200 `{ bio, photoUrl, links }`.
  - `PATCH /api/photographers/me` (auth) → body `{ bio, links: [{label, url}] }`, 200 `{ success: true }`.
  - `POST /api/photographers/me/photo` (auth) → body `{ filename, contentType }`, 200 `{ uploadUrl, key }`. Client then `PUT`s the file to `uploadUrl`, then calls `PATCH /api/photographers/me` with `{ photoKey: key }` (see Step 1) to persist it.

- [ ] **Step 1: Extend `photographerService.updateMyProfile` to also accept an optional `photoKey`**

This keeps persistence in one call after a photo upload, rather than a separate confirm endpoint. Modify the function from Task 3:

```javascript
// backend/src/services/photographerService.js — replace the existing updateMyProfile
exports.updateMyProfile = async (userId, { bio, links, photoKey }) => {
  const data = {};
  if (bio !== undefined) data.bio = bio;
  if (photoKey !== undefined) data.photographer_photo_url = photoKey;
  if (Object.keys(data).length > 0) {
    await prisma.users.update({ where: { id: userId }, data });
  }
  if (links !== undefined) {
    await prisma.photographer_links.deleteMany({ where: { user_id: userId } });
    if (links.length > 0) {
      await prisma.photographer_links.createMany({
        data: links.map((link, i) => ({ user_id: userId, label: link.label, url: link.url, sort_order: i })),
      });
    }
  }
};
```

Update `backend/src/services/__tests__/photographerService.test.js`'s `updateMyProfile` describe block to match the new partial-update behavior:

```javascript
    describe('updateMyProfile', () => {
        test('updates bio and replaces links in order', async () => {
            await photographerService.updateMyProfile(87, {
                bio: 'New bio',
                links: [{ label: 'Instagram', url: 'https://instagram.com/a' }, { label: 'SmugMug', url: 'https://smugmug.com/b' }],
            });

            expect(mockPrisma.users.update).toHaveBeenCalledWith({
                where: { id: 87 },
                data: { bio: 'New bio' },
            });
            expect(mockPrisma.photographer_links.deleteMany).toHaveBeenCalledWith({ where: { user_id: 87 } });
            expect(mockPrisma.photographer_links.createMany).toHaveBeenCalledWith({
                data: [
                    { user_id: 87, label: 'Instagram', url: 'https://instagram.com/a', sort_order: 0 },
                    { user_id: 87, label: 'SmugMug', url: 'https://smugmug.com/b', sort_order: 1 },
                ],
            });
        });

        test('updates only photoKey when bio/links are omitted', async () => {
            await photographerService.updateMyProfile(87, { photoKey: 'photographer-photos/87.jpg' });

            expect(mockPrisma.users.update).toHaveBeenCalledWith({
                where: { id: 87 },
                data: { photographer_photo_url: 'photographer-photos/87.jpg' },
            });
            expect(mockPrisma.photographer_links.deleteMany).not.toHaveBeenCalled();
        });
    });
```

Run `cd backend && npx jest src/services/__tests__/photographerService.test.js` — expect PASS (9 tests). Commit:

```bash
git add backend/src/services/photographerService.js backend/src/services/__tests__/photographerService.test.js
git commit -m "feat: support partial updates (photo-only) in photographerService.updateMyProfile"
```

- [ ] **Step 2: Write `photographerController.js`**

```javascript
// backend/src/controllers/photographerController.js
const photographerService = require('../services/photographerService');
const userService = require('../services/userService');
const {
  signedUrlForKey,
  listR2Objects,
  parseFolderName,
  parseDateStr,
  formatDateStr,
  ALLOWED_UPLOAD_CONTENT_TYPES,
  sanitizeFilename,
  s3,
  CLOUDFLARE_R2_BUCKET,
} = require('../lib/r2Storage');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

async function coverUrlForFolder(folderName) {
  const objects = await listR2Objects(`${folderName}/`);
  const images = objects.filter((o) => {
    const key = o?.Key || '';
    if (key.includes('hidden_')) return false;
    const ext = key.toLowerCase().split('.').pop();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  });
  if (images.length === 0) return null;
  const cover = images.reduce((a, b) => (new Date(b.LastModified) > new Date(a.LastModified) ? b : a));
  return signedUrlForKey(cover.Key);
}

// GET /api/photographers/:username
exports.getPublicProfile = async (req, res) => {
  try {
    const profile = await photographerService.getPublicProfileByUsername(req.params.username);
    if (!profile) return res.status(404).json({ error: 'Photographer not found' });

    const albums = (await Promise.all(profile.albums.map(async (a) => {
      const { dateStr } = parseFolderName(a.folderName);
      return {
        folder: a.folderName,
        barName: a.barName,
        date: formatDateStr(dateStr),
        sortDate: parseDateStr(dateStr)?.getTime() ?? 0,
        coverUrl: await coverUrlForFolder(a.folderName),
      };
    }))).sort((a, b) => b.sortDate - a.sortDate).map(({ sortDate, ...rest }) => rest);

    res.json({
      name: profile.name,
      bio: profile.bio,
      photoUrl: profile.photoKey ? await signedUrlForKey(profile.photoKey) : null,
      links: profile.links,
      albums,
    });
  } catch (err) {
    console.error('Error fetching photographer profile:', err);
    res.status(500).json({ error: 'Failed to fetch photographer profile' });
  }
};

async function requirePhotographer(req, res) {
  const authId = req.auth?.payload?.sub;
  if (!authId) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  const userRoles = await userService.getUserRolesByAuth0Id(authId);
  const roleName = userRoles?.roles?.name?.toLowerCase();
  if (roleName !== 'photographer' && !userRoles?.isDeveloper) {
    res.status(403).json({ error: 'Forbidden: requires photographer role' });
    return null;
  }
  return userRoles;
}

// GET /api/photographers/me
exports.getMyProfile = async (req, res) => {
  try {
    const userRoles = await requirePhotographer(req, res);
    if (!userRoles) return;

    const profile = await photographerService.getMyProfile(userRoles.id);
    res.json({
      bio: profile.bio,
      photoUrl: profile.photoKey ? await signedUrlForKey(profile.photoKey) : null,
      links: profile.links,
    });
  } catch (err) {
    console.error('Error fetching my photographer profile:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// PATCH /api/photographers/me
exports.updateMyProfile = async (req, res) => {
  try {
    const userRoles = await requirePhotographer(req, res);
    if (!userRoles) return;

    const { bio, links, photoKey } = req.body || {};
    if (links !== undefined && !Array.isArray(links)) {
      return res.status(400).json({ error: 'links must be an array' });
    }

    await photographerService.updateMyProfile(userRoles.id, { bio, links, photoKey });
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating photographer profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// POST /api/photographers/me/photo
exports.getPhotoUploadUrl = async (req, res) => {
  try {
    const userRoles = await requirePhotographer(req, res);
    if (!userRoles) return;

    const { filename, contentType } = req.body || {};
    const safeFilename = sanitizeFilename(filename, contentType);
    if (!safeFilename) {
      return res.status(400).json({ error: `Invalid filename or content type: ${filename}` });
    }

    const ext = ALLOWED_UPLOAD_CONTENT_TYPES[contentType];
    const key = `photographer-photos/${userRoles.id}.${ext}`;
    const command = new PutObjectCommand({ Bucket: CLOUDFLARE_R2_BUCKET, Key: key, ContentType: contentType });
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });

    res.json({ uploadUrl, key });
  } catch (err) {
    console.error('Error generating photo upload URL:', err);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
};
```

- [ ] **Step 3: Write `photographerRoutes.js`**

```javascript
// backend/src/routes/photographerRoutes.js
const express = require('express');
const router = express.Router();
const photographerController = require('../controllers/photographerController');
const { checkJwt } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Photographers
 *     description: Public photographer profile pages and self-service editing
 */

/**
 * @swagger
 * /api/photographers/me:
 *   get:
 *     summary: Get the logged-in photographer's own profile
 *     tags: [Photographers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires photographer role
 */
router.get('/me', checkJwt, photographerController.getMyProfile);

/**
 * @swagger
 * /api/photographers/me:
 *   patch:
 *     summary: Update the logged-in photographer's own profile
 *     tags: [Photographers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bio:
 *                 type: string
 *               links:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     label: { type: string }
 *                     url: { type: string }
 *               photoKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires photographer role
 */
router.patch('/me', checkJwt, photographerController.updateMyProfile);

/**
 * @swagger
 * /api/photographers/me/photo:
 *   post:
 *     summary: Get a presigned upload URL for the photographer's public-page photo
 *     tags: [Photographers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [filename, contentType]
 *             properties:
 *               filename: { type: string }
 *               contentType: { type: string }
 *     responses:
 *       200:
 *         description: Presigned upload URL generated
 *       400:
 *         description: Invalid filename or content type
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires photographer role
 */
router.post('/me/photo', checkJwt, photographerController.getPhotoUploadUrl);

/**
 * @swagger
 * /api/photographers/{username}:
 *   get:
 *     summary: Get a photographer's public profile
 *     tags: [Photographers]
 *     parameters:
 *       - name: username
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profile retrieved
 *       404:
 *         description: Photographer not found
 */
router.get('/:username', photographerController.getPublicProfile);

module.exports = router;
```

Note the route order: `/me` and `/me/photo` are registered before `/:username` so `GET /api/photographers/me` doesn't get swallowed by the `:username` wildcard.

- [ ] **Step 4: Mount the router in `backend/index.js`**

Add alongside the other route requires/mounts:

```javascript
const photographerRoutes = require('./src/routes/photographerRoutes');
// ...
app.use('/api/photographers', photographerRoutes);
```

- [ ] **Step 5: Manually verify against the dev server**

```bash
cd backend && npm run start &
sleep 2
curl -s http://localhost:3001/api/photographers/kirstyn | head -c 500
curl -s http://localhost:3001/api/photographers/nonexistent -o /dev/null -w "%{http_code}\n"
```

Expected: the first call returns Kirstyn's profile JSON (empty `links`/`albums` arrays, `photoUrl: null`, since nothing's been set yet); the second prints `404`. Stop the dev server afterward.

- [ ] **Step 6: Commit**

```bash
git add backend/src/controllers/photographerController.js backend/src/routes/photographerRoutes.js backend/index.js
git commit -m "feat: add public and self-service photographer profile API"
```

---

## Task 5: Wire album attribution into the existing `r2Routes.js` upload/delete endpoints

**Files:**
- Modify: `backend/src/routes/r2Routes.js`

**Interfaces:**
- Consumes: `photographerService.recordAlbumIfNew`, `photographerService.deleteAlbumRecord` (Task 3).

- [ ] **Step 1: Require `photographerService` at the top of `r2Routes.js`**

```javascript
const photographerService = require('../services/photographerService');
```

- [ ] **Step 2: Record attribution in `POST /upload-urls`, right after the existing folder-permission check**

In the `router.post('/upload-urls', ...)` handler, immediately after this existing block:

```javascript
    const allowedBarNames = await allowedBarNamesFor(userRoles);
    const { displayName: folderBarName } = parseFolderName(safeFolder);
    if (!isFolderAllowed(folderBarName, allowedBarNames)) {
      return res.status(403).json({ error: `Forbidden: not assigned to "${folderBarName}"` });
    }
```

add:

```javascript
    if (roleName === 'photographer') {
      const matchedBar = (userRoles.location_admins || []).find((la) => barNamesMatch(folderBarName, la.location_name));
      if (matchedBar) {
        await photographerService.recordAlbumIfNew({
          folderName: safeFolder,
          locationId: matchedBar.location_id,
          photographerId: userRoles.id,
        });
      }
    }
```

(`matchedBar` should always be found here since `isFolderAllowed` already passed for a non-developer caller, but the `if` guards against the developer case, where `allowedBarNamesFor` returns `null` and there's nothing to match against.)

- [ ] **Step 3: Delete attribution in `DELETE /albums`, right before responding with success**

In the `router.delete('/albums', ...)` handler, immediately before:

```javascript
    res.json({ success: true, deletedCount: objects.length });
```

add:

```javascript
    await photographerService.deleteAlbumRecord(safeFolder);
```

- [ ] **Step 4: Manually verify end-to-end against the dev server and dev DB**

```bash
cd backend && npm run start &
sleep 2
```

Get a dev access token for Kirstyn's account (or use whatever manual-testing flow the project already uses for authenticated endpoints — e.g. the admin portal's dev-preview login against `apidev.amesafterdark.com`), then:

```bash
# create a brand-new test album as Kirstyn and confirm a photo_albums row appears
curl -s -X POST http://localhost:3001/api/r2/upload-urls \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"folder":"Outlaws_09-06-test","files":[{"filename":"test.jpg","contentType":"image/jpeg"}]}'
```

```bash
ssh oracle "sudo -u postgres psql -d ames_after_dark_dev -c \"SELECT * FROM app.photo_albums WHERE folder_name = 'Outlaws_09-06-test';\""
```

Expected: one row, `photographer_id` = Kirstyn's dev-DB user id. Then delete the test album via `DELETE /api/r2/albums?folder=Outlaws_09-06-test` with the same token and re-run the `psql` check — expect zero rows. Stop the dev server afterward.

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/r2Routes.js
git commit -m "feat: attribute new albums to their creating photographer, clean up on delete"
```

---

## Task 6: Public page — `pages/PhotographerProfile.jsx`

**Files:**
- Create: `ames-after-dark-admin-portal/site/src/pages/PhotographerProfile.jsx`
- Modify: `ames-after-dark-admin-portal/site/src/App.jsx` (add the route)

**Interfaces:**
- Consumes: `GET /api/photographers/:username` (Task 4) — no auth header sent, this page is public.

- [ ] **Step 1: Write `PhotographerProfile.jsx`**

```jsx
// ames-after-dark-admin-portal/site/src/pages/PhotographerProfile.jsx
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { API_BASE } from '../api/config';

export default function PhotographerProfile() {
    const { username } = useParams();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);
            setNotFound(false);
            setError('');
            try {
                const response = await fetch(`${API_BASE}/api/photographers/${encodeURIComponent(username)}`);
                if (response.status === 404) {
                    if (!cancelled) setNotFound(true);
                    return;
                }
                if (!response.ok) throw new Error(`Profile API failed: ${response.status}`);
                const data = await response.json();
                if (!cancelled) setProfile(data);
            } catch (err) {
                console.error('Failed to load photographer profile:', err);
                if (!cancelled) setError('Failed to load this page. Please try again.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [username]);

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
                    {loading && (
                        <div className="a-loading" role="status" aria-live="polite">
                            <span className="a-spinner" aria-hidden="true"></span>
                            <span>Loading...</span>
                        </div>
                    )}

                    {!loading && notFound && (
                        <div className="a-empty">No photographer found at this page.</div>
                    )}

                    {!loading && error && <p className="a-error">{error}</p>}

                    {!loading && !notFound && !error && profile && (
                        <>
                            <section className="a-page-head" style={{ alignItems: 'center', gap: '20px' }}>
                                {profile.photoUrl ? (
                                    <img
                                        src={profile.photoUrl}
                                        alt={profile.name}
                                        style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div
                                        style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--a-border, #333)' }}
                                        aria-hidden="true"
                                    ></div>
                                )}
                                <div>
                                    <h1 className="a-h1">{profile.name}</h1>
                                    {profile.bio && <p className="a-sub">{profile.bio}</p>}
                                </div>
                            </section>

                            {profile.links.length > 0 && (
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
                                    {profile.links.map((link) => (
                                        <a
                                            key={link.url}
                                            className="a-btn a-btn--ghost"
                                            href={link.url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {link.label}
                                        </a>
                                    ))}
                                </div>
                            )}

                            <h2 className="a-h1" style={{ fontSize: '19px' }}>Albums</h2>
                            {profile.albums.length === 0 ? (
                                <div className="a-empty">No albums yet.</div>
                            ) : (
                                <div className="a-photogrid" role="list">
                                    {profile.albums.map((album) => (
                                        <div key={album.folder} className="a-photocard" role="listitem">
                                            {album.coverUrl && (
                                                <img
                                                    className="a-photocard__cover"
                                                    src={album.coverUrl}
                                                    alt={album.barName}
                                                    loading="lazy"
                                                />
                                            )}
                                            <div className="a-photocard__body">
                                                <h3 className="a-photocard__title">{album.barName}</h3>
                                                <p className="a-photocard__date">{album.date}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
```

- [ ] **Step 2: Add the route in `App.jsx`**

```jsx
import PhotographerProfile from './pages/PhotographerProfile.jsx'
// ...
<Route path="/photographers/:username" element={<PhotographerProfile />} />
```

- [ ] **Step 3: Manually verify in a browser**

```bash
cd site && npm run dev
```

Visit `http://localhost:5173/photographers/kirstyn` (or the dev server's `apidev`-backed equivalent, depending on `VITE_API_BASE`) while logged out. Expected: the page renders without requiring login, shows Kirstyn's name and an empty-albums/empty-links state (since none exist yet). Visit `http://localhost:5173/photographers/nobody` and confirm the "No photographer found" state renders instead of an error.

- [ ] **Step 4: Commit**

```bash
git add site/src/pages/PhotographerProfile.jsx site/src/App.jsx
git commit -m "feat: add public photographer profile page"
```

---

## Task 7: Self-edit UI — `components/PhotographerProfileEditor.jsx`, mounted in the existing Photographer page

**Files:**
- Create: `ames-after-dark-admin-portal/site/src/components/PhotographerProfileEditor.jsx`
- Modify: `ames-after-dark-admin-portal/site/src/pages/Photographer.jsx` (mount the new component; no other logic in this 665-line file changes)

**Interfaces:**
- Consumes: `GET/PATCH /api/photographers/me`, `POST /api/photographers/me/photo` (Task 4); `useAuth0().getAccessTokenSilently` and `useRoles().isAdmin` (both already used identically elsewhere in `Photographer.jsx`).

- [ ] **Step 1: Write `PhotographerProfileEditor.jsx`**

```jsx
// ames-after-dark-admin-portal/site/src/components/PhotographerProfileEditor.jsx
import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { API_BASE } from '../api/config';

const ME_API = `${API_BASE}/api/photographers/me`;
const PHOTO_API = `${API_BASE}/api/photographers/me/photo`;

export default function PhotographerProfileEditor({ username }) {
    const { getAccessTokenSilently } = useAuth0();

    const [loading, setLoading] = useState(true);
    const [bio, setBio] = useState('');
    const [links, setLinks] = useState([]);
    const [photoUrl, setPhotoUrl] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const token = await getAccessTokenSilently();
                const response = await fetch(ME_API, { headers: { Authorization: `Bearer ${token}` } });
                if (!response.ok) throw new Error(`Failed to load profile (${response.status})`);
                const data = await response.json();
                setBio(data.bio || '');
                setLinks(data.links || []);
                setPhotoUrl(data.photoUrl);
            } catch (err) {
                console.error('Failed to load my photographer profile:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, [getAccessTokenSilently]);

    const updateLink = (idx, field, value) => {
        setLinks((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
    };

    const addLink = () => setLinks((prev) => [...prev, { label: '', url: '' }]);
    const removeLink = (idx) => setLinks((prev) => prev.filter((_, i) => i !== idx));

    const save = async () => {
        setSaving(true);
        setSaveMessage('');
        try {
            const token = await getAccessTokenSilently();

            let photoKey;
            if (photoFile) {
                const presignRes = await fetch(PHOTO_API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ filename: photoFile.name, contentType: photoFile.type }),
                });
                if (!presignRes.ok) throw new Error(`Failed to get photo upload URL (${presignRes.status})`);
                const { uploadUrl, key } = await presignRes.json();

                const putRes = await fetch(uploadUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': photoFile.type },
                    body: photoFile,
                });
                if (!putRes.ok) throw new Error(`Photo upload failed (${putRes.status})`);
                photoKey = key;
            }

            const validLinks = links.filter((l) => l.label.trim() && l.url.trim());
            const patchRes = await fetch(ME_API, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ bio, links: validLinks, ...(photoKey ? { photoKey } : {}) }),
            });
            if (!patchRes.ok) throw new Error(`Failed to save profile (${patchRes.status})`);

            setLinks(validLinks);
            setPhotoFile(null);
            setSaveMessage('Saved!');
        } catch (err) {
            console.error('Failed to save photographer profile:', err);
            setSaveMessage(`Failed to save: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="a-loading" role="status" aria-live="polite">
                <span className="a-spinner" aria-hidden="true"></span>
                <span>Loading your profile...</span>
            </div>
        );
    }

    return (
        <section style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid var(--a-border, #333)' }}>
            <div className="a-page-head">
                <div>
                    <h2 className="a-h1" style={{ fontSize: '19px' }}>My Profile</h2>
                    <p className="a-sub">This is what shows on your public page.</p>
                </div>
                {username && (
                    <a className="a-btn a-btn--ghost" href={`/photographers/${username}`} target="_blank" rel="noreferrer">
                        View my public page
                    </a>
                )}
            </div>

            <div className="a-field">
                <div className="a-label">Photo</div>
                {(photoFile ? URL.createObjectURL(photoFile) : photoUrl) && (
                    <img
                        src={photoFile ? URL.createObjectURL(photoFile) : photoUrl}
                        alt="Profile"
                        style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', marginBottom: '10px', display: 'block' }}
                    />
                )}
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                    disabled={saving}
                />
            </div>

            <div className="a-field">
                <div className="a-label">Bio</div>
                <textarea
                    className="a-input"
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    disabled={saving}
                />
            </div>

            <div className="a-field">
                <div className="a-label">Links</div>
                {links.map((link, idx) => (
                    <div key={idx} className="a-row2" style={{ marginBottom: '8px' }}>
                        <input
                            className="a-input"
                            placeholder="Label (e.g. Instagram)"
                            value={link.label}
                            onChange={(e) => updateLink(idx, 'label', e.target.value)}
                            disabled={saving}
                        />
                        <input
                            className="a-input"
                            placeholder="URL"
                            value={link.url}
                            onChange={(e) => updateLink(idx, 'url', e.target.value)}
                            disabled={saving}
                        />
                        <button className="a-btn a-btn--ghost" type="button" onClick={() => removeLink(idx)} disabled={saving}>
                            Remove
                        </button>
                    </div>
                ))}
                <button className="a-btn a-btn--ghost" type="button" onClick={addLink} disabled={saving}>
                    Add link
                </button>
            </div>

            <div className="a-modal__actions" style={{ padding: 0 }}>
                <button className="a-btn a-btn--primary" type="button" onClick={save} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Profile'}
                </button>
                {saveMessage && <span className="a-sub" style={{ marginLeft: '12px' }}>{saveMessage}</span>}
            </div>
        </section>
    );
}
```

- [ ] **Step 2: Mount it in `Photographer.jsx`**

Add the import near the top of `ames-after-dark-admin-portal/site/src/pages/Photographer.jsx`:

```jsx
import PhotographerProfileEditor from '../components/PhotographerProfileEditor.jsx';
```

`Photographer.jsx` doesn't currently have access to the logged-in user's own `username` (it only tracks role/albums), so add one line near the other `useState` declarations to read it from Auth0's user object, which `useAuth0()` already exposes:

```jsx
const { isAuthenticated, isLoading, logout, getAccessTokenSilently, user } = useAuth0();
// ...
const myUsername = user?.nickname; // Auth0's `nickname` claim mirrors the app's `username` for this login flow
```

Then render the editor at the bottom of the main authenticated view, just before the closing `</div>` of `<div className="a-container">` (after the `{selectedAlbum && (...)}` block, only shown on the albums list view, not while browsing inside an album):

```jsx
{!selectedAlbum && (isAdmin === 'photographer') && (
    <PhotographerProfileEditor username={myUsername} />
)}
```

- [ ] **Step 3: Manually verify in a browser**

```bash
cd site && npm run dev
```

Log in as Kirstyn (or use `?preview=1` dev-preview mode if role-gating makes that easier locally), navigate to `/photographer`, and confirm the "My Profile" section appears below the albums grid with empty bio/links/photo. Set a bio, add a link, upload a photo, and save. Reload the page and confirm the saved values come back. Then visit `/photographers/kirstyn` in a separate logged-out tab and confirm the same bio/link/photo now show there.

- [ ] **Step 4: Commit**

```bash
git add site/src/components/PhotographerProfileEditor.jsx site/src/pages/Photographer.jsx
git commit -m "feat: add self-service My Profile editor to the Photographer portal page"
```
