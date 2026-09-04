const express = require('express');
const { PutObjectCommand, CopyObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { checkJwt } = require('../middleware/authMiddleware');
const userService = require('../services/userService');
const locationService = require('../services/locationService');
const photographerService = require('../services/photographerService');
const {
  s3,
  CLOUDFLARE_R2_BUCKET,
  ALLOWED_UPLOAD_CONTENT_TYPES,
  signedUrlForKey,
  objectExists,
  listR2Objects,
  parseFolderName,
  parseDateStr,
  formatDateStr,
  sanitizeFilename,
  isListablePhotoKey,
} = require('../lib/r2Storage');

const router = express.Router();

/**
 * Loosely normalize a bar name for matching R2's free-typed folder names
 * (e.g. "Sip's", "Cy's Roost") against the canonical app.locations.name -
 * strip everything but letters/digits and lowercase.
 */
function normalizeBarName(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function barNamesMatch(a, b) {
  const na = normalizeBarName(a);
  const nb = normalizeBarName(b);
  if (!na || !nb) return false;
  return na.startsWith(nb) || nb.startsWith(na);
}

/**
 * Resolve which bar (folder) names a user is allowed to upload/delete for.
 * Developers get null (no restriction). Photographers and bar owners
 * (admin role) get the bar names from their location_admins links.
 * Everyone else gets an empty list.
 */
async function allowedBarNamesFor(userRoles) {
  if (userRoles?.isDeveloper) return null; // null = unrestricted
  const roleName = userRoles?.roles?.name?.toLowerCase();
  if (roleName !== 'photographer' && roleName !== 'admin') return [];
  return (userRoles.location_admins || []).map((la) => la.location_name).filter(Boolean);
}

function isFolderAllowed(folderDisplayName, allowedNames) {
  if (allowedNames === null) return true; // developer, unrestricted
  return allowedNames.some((name) => barNamesMatch(folderDisplayName, name));
}

/**
 * Validate a top-level album folder name (e.g. "Outlaws_04-09").
 * Must be a single path segment matching the naming convention the
 * read endpoints already parse (parseFolderName) - no nested paths,
 * no traversal, reasonable charset.
 */
function sanitizeFolderName(folder) {
  const trimmed = String(folder || '').trim();
  if (!trimmed || trimmed.includes('/') || trimmed.includes('..')) return null;
  if (!/^[\w\s-]+$/.test(trimmed)) return null;
  return trimmed;
}

/**
 * Given a desired key, return a key guaranteed not to collide with an
 * existing object - appends a short suffix if needed.
 */
async function uniqueKeyFor(folder, filename) {
  const dot = filename.lastIndexOf('.');
  const base = dot === -1 ? filename : filename.slice(0, dot);
  const ext = dot === -1 ? '' : filename.slice(dot);

  let candidate = `${folder}/${filename}`;
  let suffix = 0;
  while (await objectExists(candidate)) {
    suffix += 1;
    candidate = `${folder}/${base}-${Date.now().toString(36)}${suffix > 1 ? `-${suffix}` : ''}${ext}`;
  }
  return candidate;
}

/**
 * @swagger
 * tags:
 *   - name: Storage
 *     description: Image storage and retrieval from Cloudflare R2
 */

/**
 * GET /api/r2/albums
 * List albums (bar folders) from R2.
 * Filters to most recent weekend based on date in folder name.
 */
/**
 * @swagger
 * /api/r2/albums:
 *   get:
 *     summary: Get all photo albums
 *     description: Retrieves all available photo albums from Cloudflare R2 storage, grouped by bar/venue with the most recent weekend albums displayed first
 *     tags:
 *       - Storage
 *     responses:
 *       200:
 *         description: Albums retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Album folder ID
 *                   name:
 *                     type: string
 *                     description: Bar or venue name
 *                   barName:
 *                     type: string
 *                     description: Bar name for sorting
 *                   date:
 *                     type: string
 *                     description: Album date (MM/DD)
 *                   coverUrl:
 *                     type: string
 *                     description: Signed URL to album cover image
 *                   albumUri:
 *                     type: string
 *                     description: Album URI for querying photos
 *       500:
 *         description: Server error
 */
router.get('/albums', async (req, res) => {
  try {
    const allObjects = await listR2Objects('');
    console.log(`r2Routes: got ${allObjects.length} objects`);
    if (!allObjects || allObjects.length === 0) { return res.json([]); }

    // Group photos by bar folder
    const photosByFolder = {};

    for (const obj of allObjects) {
      const key = obj?.Key || '';

      const folderName = key.split('/')[0];

      // Skip if no bar folder, or this isn't a real listable photo
      if (!folderName || !isListablePhotoKey(key)) continue;

      if (!photosByFolder[folderName]) photosByFolder[folderName] = [];
      photosByFolder[folderName].push(obj);
    }

    // Parse dates and find most recent folder date
    const folderMeta = {};
    for (const folderName of Object.keys(photosByFolder)) {
      const { displayName, dateStr } = parseFolderName(folderName);
      const date = parseDateStr(dateStr);
      folderMeta[folderName] = { displayName, dateStr, date };
    }

    // Folders that pass the date filter below are the ones we'll actually
    // return - look up photographer attribution for exactly those, in one
    // batch query rather than one per folder.
    const validFolderNames = Object.keys(photosByFolder).filter(
      (folderName) => folderMeta[folderName].date != null
    );
    const attributionByFolder = await photographerService.getAttributionForFolders(validFolderNames);

    // Build albums for folders that have a valid date
    const albums = await Promise.all(
      validFolderNames.map(async (folderName) => {
        const objects = photosByFolder[folderName];
        const meta = folderMeta[folderName];
        const attribution = attributionByFolder.get(folderName);

        // Pick most recently modified photo as cover
        const cover = objects.reduce((a, b) =>
          new Date(b.LastModified) > new Date(a.LastModified) ? b : a);
        const coverUrl = await signedUrlForKey(cover.Key);

        return {
          id: folderName,
          name: meta.displayName,
          barName: meta.displayName,
          date: formatDateStr(meta.dateStr),
          sortDate: meta.date.getTime(),
          coverUrl,
          albumUri: `${folderName}/`,
          photographerUsername: attribution?.photographerUsername ?? null,
          photographerName: attribution?.photographerName ?? null,
        };
      })
    );

    // Newest first
    albums.sort((a, b) => b.sortDate - a.sortDate);
    res.json(albums);
  } catch (err) {
    console.error('Error fetching albums:', err);
    res.status(500).json({ error: 'Failed to fetch albums' });
  }
});

/**
 * GET /api/r2/photos?prefix=:prefix
 * Fetch photos for a given album (bar folder prefix).
 * Returns array of { id, image: { uri } } with signed URLs.
 */
/**
 * @swagger
 * /api/r2/photos:
 *   get:
 *     summary: Get photos from an album
 *     description: Retrieves all photos from a specific album with signed URLs valid for 1 hour
 *     tags:
 *       - Storage
 *     parameters:
 *       - name: prefix
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Album folder prefix/ID
 *     responses:
 *       200:
 *         description: Photos retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Photo ID
 *                   image:
 *                     type: object
 *                     properties:
 *                       uri:
 *                         type: string
 *                         description: Signed URL to photo (valid for 1 hour)
 *       400:
 *         description: Missing prefix query parameter
 *       500:
 *         description: Server error
 */
router.get('/photos', async (req, res) => {
  try {
    const prefix = req.query.prefix || '';
    if (!prefix) return res.status(400).json({ error: 'Missing prefix query param' });

    let normalizedPrefix = prefix.replace(/^\//, '');
    if (!normalizedPrefix.endsWith('/')) normalizedPrefix = `${normalizedPrefix}/`;

    const objs = await listR2Objects(normalizedPrefix);
    if (!objs.length) return res.json([]);

    const imageObjs = objs.filter(o => isListablePhotoKey(o?.Key || ''));

    const photos = await Promise.all(imageObjs.map(async (o) => ({
      id: o.Key,
      image: { uri: await signedUrlForKey(o.Key) },
    })));

    res.json(photos);
  } catch (err) {
    console.error('Error fetching photos:', err);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

/**
 * PATCH /api/r2/photos/hide
 * Soft deletes a photo by prepending "hidden_" to its filename in R2.
 * Requires photographer, bar owner (admin), or developer role, scoped to
 * the caller's assigned bars.
 */
/**
 * @swagger
 * /api/r2/photos/hide:
 * patch:
 * summary: Hide a photo
 * description: Soft-deletes a photo from the public app by renaming the object key with a 'hidden_' prefix.
 * tags:
 * - Storage
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - key
 * properties:
 * key:
 * type: string
 * description: The S3 object key of the photo to hide
 * responses:
 * 200:
 * description: Photo hidden successfully
 * 400:
 * description: Missing key parameter
 * 401:
 * description: Unauthorized
 * 403:
 * description: Forbidden - not assigned to this bar
 * 500:
 * description: Server error
 */
router.patch('/photos/hide', checkJwt, async (req, res) => {
  try {
    const authId = req.auth?.payload?.sub;
    if (!authId) return res.status(401).json({ error: 'Unauthorized' });

    const userRoles = await userService.getUserRolesByAuth0Id(authId);
    const roleName = userRoles?.roles?.name?.toLowerCase();
    if (roleName !== 'photographer' && roleName !== 'admin' && roleName !== 'developer') {
      return res.status(403).json({ error: 'Forbidden: requires photographer, bar owner, or developer role' });
    }

    const { key } = req.body;
    if (!key) return res.status(400).json({ error: 'Missing key parameter' });

    const folderName = String(key).split('/')[0];
    const allowedBarNames = await allowedBarNamesFor(userRoles);
    const { displayName: folderBarName } = parseFolderName(folderName);
    if (!isFolderAllowed(folderBarName, allowedBarNames)) {
      return res.status(403).json({ error: `Forbidden: not assigned to "${folderBarName}"` });
    }

    // Split the path to isolate the filename from the folder
    // e.g., "Outlaws 04-09/_DSC9171.jpg" -> folder: "Outlaws 04-09", filename: "_DSC9171.jpg"
    const parts = key.split('/');
    const fileName = parts.pop();
    const folderPath = parts.join('/');
    
    // Inject "hidden_" right before the filename
    const newKey = folderPath ? `${folderPath}/hidden_${fileName}` : `hidden_${fileName}`;

    // Copy the object to its new "hidden_" name
    const copyCommand = new CopyObjectCommand({
      Bucket: CLOUDFLARE_R2_BUCKET,
      CopySource: `${CLOUDFLARE_R2_BUCKET}/${encodeURI(key)}`,
      Key: newKey,
    });
    await s3.send(copyCommand);

    // Delete the old object
    const deleteCommand = new DeleteObjectCommand({
      Bucket: CLOUDFLARE_R2_BUCKET,
      Key: key,
    });
    await s3.send(deleteCommand);

    // Best-effort: also remove any cached preview thumbnail for this photo,
    // so a hidden photo doesn't stay reachable via the public preview endpoint
    const thumbKey = folderPath ? `${folderPath}/thumb_${fileName}` : `thumb_${fileName}`;
    if (await objectExists(thumbKey)) {
      await s3.send(new DeleteObjectCommand({ Bucket: CLOUDFLARE_R2_BUCKET, Key: thumbKey }));
    }

    res.json({ success: true, message: 'Photo hidden successfully', newKey });
  } catch (err) {
    console.error('Error hiding photo:', err);
    res.status(500).json({ error: 'Failed to hide photo' });
  }
});

/**
 * POST /api/r2/upload-urls
 * Generate presigned PUT URLs so a photographer's browser can upload
 * JPG/PNG/GIF/WebP files directly to R2. Requires a photographer or
 * developer role. Files upload to {folder}/{filename}, matching the
 * existing album-folder naming convention (parseFolderName above) -
 * pass an existing album's id to add to it, or a new "BarName_MM-DD"
 * string to start one.
 */
/**
 * @swagger
 * /api/r2/upload-urls:
 *   post:
 *     summary: Get presigned upload URLs for photos
 *     description: Generates presigned PUT URLs for uploading images directly to R2. Requires photographer or developer role.
 *     tags:
 *       - Storage
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - folder
 *               - files
 *             properties:
 *               folder:
 *                 type: string
 *                 description: Album folder name, e.g. "Outlaws_04-09"
 *               files:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     filename:
 *                       type: string
 *                     contentType:
 *                       type: string
 *     responses:
 *       200:
 *         description: Presigned upload URLs generated successfully
 *       400:
 *         description: Invalid folder, filenames, or content types
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires photographer or developer role
 *       500:
 *         description: Server error
 */
router.post('/upload-urls', checkJwt, async (req, res) => {
  try {
    const authId = req.auth?.payload?.sub;
    if (!authId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRoles = await userService.getUserRolesByAuth0Id(authId);
    const roleName = userRoles?.roles?.name?.toLowerCase();
    if (roleName !== 'photographer' && roleName !== 'admin' && roleName !== 'developer') {
      return res.status(403).json({ error: 'Forbidden: requires photographer, bar owner, or developer role' });
    }

    const { folder, files } = req.body || {};

    const safeFolder = sanitizeFolderName(folder);
    if (!safeFolder) {
      return res.status(400).json({ error: 'Invalid folder name' });
    }

    const allowedBarNames = await allowedBarNamesFor(userRoles);
    const { displayName: folderBarName } = parseFolderName(safeFolder);
    if (!isFolderAllowed(folderBarName, allowedBarNames)) {
      return res.status(403).json({ error: `Forbidden: not assigned to "${folderBarName}"` });
    }

    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'files must be a non-empty array' });
    }
    if (files.length > 100) {
      return res.status(400).json({ error: 'Too many files in one request (max 100)' });
    }

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

    const uploads = [];
    for (const file of files) {
      const safeFilename = sanitizeFilename(file?.filename, file?.contentType);
      if (!safeFilename) {
        return res.status(400).json({ error: `Invalid filename or content type: ${file?.filename}` });
      }

      const key = await uniqueKeyFor(safeFolder, safeFilename);
      const command = new PutObjectCommand({
        Bucket: CLOUDFLARE_R2_BUCKET,
        Key: key,
        ContentType: file.contentType,
      });
      const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 }); // 15 minutes

      uploads.push({ filename: file.filename, key, uploadUrl });
    }

    res.json({ uploads });
  } catch (err) {
    console.error('Error generating upload URLs:', err);
    res.status(500).json({ error: 'Failed to generate upload URLs' });
  }
});

/**
 * GET /api/r2/my-bars
 * Bars the current user may upload/delete photos for - all bars for
 * developers, only their assigned bars for photographers.
 */
/**
 * @swagger
 * /api/r2/my-bars:
 *   get:
 *     summary: Get bars the current user can manage photos for
 *     description: Developers get every bar; photographers get only the bars they're assigned to via location_admins.
 *     tags:
 *       - Storage
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of { id, name } bars
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires photographer or developer role
 */
router.get('/my-bars', checkJwt, async (req, res) => {
  try {
    const authId = req.auth?.payload?.sub;
    if (!authId) return res.status(401).json({ error: 'Unauthorized' });

    const userRoles = await userService.getUserRolesByAuth0Id(authId);
    const roleName = userRoles?.roles?.name?.toLowerCase();
    if (roleName !== 'photographer' && roleName !== 'admin' && roleName !== 'developer') {
      return res.status(403).json({ error: 'Forbidden: requires photographer, bar owner, or developer role' });
    }

    if (userRoles.isDeveloper) {
      const allLocations = await locationService.getLocations();
      return res.json(allLocations.map((l) => ({ id: l.id, name: l.name })));
    }

    const myBars = (userRoles.location_admins || []).map((la) => ({ id: la.location_id, name: la.location_name }));
    res.json(myBars);
  } catch (err) {
    console.error('Error fetching my-bars:', err);
    res.status(500).json({ error: 'Failed to fetch bars' });
  }
});

/**
 * DELETE /api/r2/albums?folder=:folder
 * Delete an entire album (every object under that folder prefix).
 * Requires photographer or developer role, and the folder's bar must be
 * one the caller is assigned to (developers can delete any album).
 */
/**
 * @swagger
 * /api/r2/albums:
 *   delete:
 *     summary: Delete an entire album
 *     description: Permanently deletes every photo in the given album folder. Requires photographer or developer role, scoped to the caller's assigned bars.
 *     tags:
 *       - Storage
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: folder
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Album folder name to delete
 *     responses:
 *       200:
 *         description: Album deleted successfully
 *       400:
 *         description: Missing or invalid folder
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not assigned to this bar
 *       500:
 *         description: Server error
 */
router.delete('/albums', checkJwt, async (req, res) => {
  try {
    const authId = req.auth?.payload?.sub;
    if (!authId) return res.status(401).json({ error: 'Unauthorized' });

    const userRoles = await userService.getUserRolesByAuth0Id(authId);
    const roleName = userRoles?.roles?.name?.toLowerCase();
    if (roleName !== 'photographer' && roleName !== 'admin' && roleName !== 'developer') {
      return res.status(403).json({ error: 'Forbidden: requires photographer, bar owner, or developer role' });
    }

    const safeFolder = sanitizeFolderName(req.query.folder);
    if (!safeFolder) {
      return res.status(400).json({ error: 'Invalid folder name' });
    }

    const allowedBarNames = await allowedBarNamesFor(userRoles);
    const { displayName: folderBarName } = parseFolderName(safeFolder);
    if (!isFolderAllowed(folderBarName, allowedBarNames)) {
      return res.status(403).json({ error: `Forbidden: not assigned to "${folderBarName}"` });
    }

    const objects = await listR2Objects(`${safeFolder}/`);
    if (objects.length === 0) {
      return res.status(404).json({ error: 'Album not found or already empty' });
    }

    await Promise.all(objects.map((obj) =>
      s3.send(new DeleteObjectCommand({ Bucket: CLOUDFLARE_R2_BUCKET, Key: obj.Key }))
    ));

    await photographerService.deleteAlbumRecord(safeFolder);

    res.json({ success: true, deletedCount: objects.length });
  } catch (err) {
    console.error('Error deleting album:', err);
    res.status(500).json({ error: 'Failed to delete album' });
  }
});

module.exports = router;