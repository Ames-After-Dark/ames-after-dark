const express = require('express');
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const router = express.Router();

const {
  CLOUDFLARE_R2_ACCESS_KEY_ID,
  CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  CLOUDFLARE_R2_BUCKET,
  CLOUDFLARE_R2_S3_ENDPOINT,
} = process.env;

// Initialize S3 client for R2 (used for generating signed URLs if needed)
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
  return await getSignedUrl(s3, command, { expiresIn: 3600 }); // Change expiresIn to adjust duration
}

/**
 * List objects in R2 with optional prefix and limit.
 */
async function listR2Objects(prefix = '', limit = 1000) {
  try {
    const command = new ListObjectsV2Command({
      Bucket: CLOUDFLARE_R2_BUCKET,
      Prefix: prefix,
      MaxKeys: limit,
    });
    const response = await s3.send(command);
    return response.Contents || [];
  } catch (err) {
    console.warn('R2 list error:', err);
    return [];
  }
}

/**
 * Parse a folder name like "Bar Name 09-23" into display name and date string.
 * If no date found, returns display name as-is and dateStr as null.
 */
function parseFolderName(folderName) {
  const match = folderName.trim().match(/^(.+?)\s+(\d{1,2}-\d{1,2})$/);
  if (match) return { displayName: match[1], dateStr: match[2] };

  return { displayName: folderName.trim(), dateStr: null };
}

/**
 * Build a public S3-style URL for an R2 object key.
 */
function urlForKey(key) {
  const endpoint = (CLOUDFLARE_R2_S3_ENDPOINT || '').replace(/\/$/, '');
  const bucket = CLOUDFLARE_R2_BUCKET || '';
  return `${endpoint}/${bucket}/${key}`;
}

/**
 * Parse a date string like "03-12" into a Date object.
 * If date is in the future, roll back to previous year.
 */
function parseDateStr(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 2) return null;

  const month = parseInt(parts[0], 10) - 1;
  const day = parseInt(parts[1], 10);
  if (isNaN(month) || isNaN(day)) return null;

  const now = new Date();
  let candidate = new Date(now.getFullYear(), month, day);
  if (candidate > now) candidate = new Date(now.getFullYear() - 1, month, day);

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
 * GET /api/r2/albums
 * List albums (bar folders) from R2.
 * Filters to most recent weekend based on date in folder name.
 */
router.get('/albums', async (req, res) => {
  try {
    const allObjects = await listR2Objects('', 5000);
    console.log(`r2Routes: got ${allObjects.length} objects`);
    if (!allObjects) { return res.json([]); }

    // Group photos by bar folder
    const photosByFolder = {};

    for (const obj of allObjects) {
      const key = obj?.Key || '';
      const folderName = key.split('/')[0];
      const ext = key.toLowerCase().split('.').pop();

      // Skip if no bar folder or doesn't look like an image
      if (!folderName || !['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) continue;

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

    const allDates = Object.values(folderMeta).map(m => m.date).filter(Boolean).map(d => d.getTime());
    if (!allDates.length) return res.json([]);
    const latestTime = Math.max(...allDates);

    // Build albums for folders matching the latest date
    const albums = await Promise.all(
      Object.entries(photosByFolder).filter(([folderName]) => {
        const meta = folderMeta[folderName];
        return meta.date && meta.date.getTime() === latestTime;
      })
        .map(async ([folderName, objects]) => {
          const meta = folderMeta[folderName];
          // Pick most recently modified photo as cover
          const cover = objects.reduce((a, b) =>
            new Date(b.LastModified) > new Date(a.LastModified) ? b : a);
          const coverUrl = await signedUrlForKey(cover.Key);

          return {
            id: folderName,
            name: meta.displayName,
            barName: meta.displayName,
            date: formatDateStr(meta.dateStr),
            coverUrl,
            albumUri: `${folderName}/`,
          };
        })
    );
    albums.sort((a, b) => a.barName.localeCompare(b.barName));
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
router.get('/photos', async (req, res) => {
  try {
    const prefix = req.query.prefix || '';
    if (!prefix) return res.status(400).json({ error: 'Missing prefix query param' });

    let normalizedPrefix = prefix.replace(/^\//, '');
    if (!normalizedPrefix.endsWith('/')) normalizedPrefix = `${normalizedPrefix}/`;

    const objs = await listR2Objects(normalizedPrefix, 5000);
    if (!objs.length) return res.json([]);

    const imageObjs = objs.filter(o =>
      ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(
        (o?.Key || '').toLowerCase().split('.').pop())
    );

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

module.exports = router;