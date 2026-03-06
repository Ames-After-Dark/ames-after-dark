const express = require('express');

const router = express.Router();

const {
  CLOUDFLARE_R2_API_TOKEN,
  CLOUDFLARE_R2_ACCOUNT_ID,
  CLOUDFLARE_R2_BUCKET,
  CLOUDFLARE_R2_S3_ENDPOINT,
} = process.env;

/**
 * Helper: Build a public S3-style URL for an R2 object key.
 */
function urlForKey(key) {
  const endpoint = (CLOUDFLARE_R2_S3_ENDPOINT || '').replace(/\/$/, '');
  const bucket = CLOUDFLARE_R2_BUCKET || '';
  return `${endpoint}/${bucket}/${key}`;
}

/**
 * Helper: List objects in R2 under a given prefix using Cloudflare Account API.
 */
async function listR2Objects(prefix = '', limit = 1000) {
  if (!CLOUDFLARE_R2_API_TOKEN || !CLOUDFLARE_R2_ACCOUNT_ID || !CLOUDFLARE_R2_BUCKET) {
    return [];
  }
  const base = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_R2_ACCOUNT_ID}/r2/buckets/${CLOUDFLARE_R2_BUCKET}/objects`;
  const url = `${base}?limit=${limit}${prefix ? `&prefix=${encodeURIComponent(prefix)}` : ''}`;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_R2_API_TOKEN}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      console.warn('R2 list objects failed:', res.status, res.statusText);
      return [];
    }
    const data = await res.json();
    const objects = data?.result?.objects || data?.objects || data?.result || [];
    return objects;
  } catch (err) {
    console.warn('R2 list error:', err);
    return [];
  }
}

/**
 * Helper: Get the Thursday of the weekend that a date belongs to.
 * A "weekend" spans Thursday through Saturday of the same week.
 */
function getWeekendThursday(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 4 = Thursday, 5 = Friday, 6 = Saturday
  let daysBack = 0;
  if (day === 0) daysBack = 3; // Sunday -> back 3 days to Thursday
  else if (day === 1) daysBack = 4; // Monday -> back 4 days to Thursday
  else if (day === 2) daysBack = 5; // Tuesday -> back 5 days to Thursday
  else if (day === 3) daysBack = 6; // Wednesday -> back 6 days to Thursday
  else if (day === 4) daysBack = 0; // Thursday -> same day
  else if (day === 5) daysBack = -1; // Friday -> back 1 day to Thursday
  else if (day === 6) daysBack = -2; // Saturday -> back 2 days to Thursday
  const thursday = new Date(d);
  thursday.setDate(thursday.getDate() - daysBack);
  thursday.setHours(0, 0, 0, 0);
  return thursday;
}

/**
 * GET /api/r2/albums
 * List albums (bar folders) from R2, grouped by bar name.
 * Filters to photos from the most recent Thursday-Saturday "weekend" that has uploads.
 */
router.get('/albums', async (req, res) => {
  try {
    const allObjects = await listR2Objects('', 5000);
    if (!allObjects || allObjects.length === 0) {
      return res.json([]);
    }

    // Collect all valid photos with their upload dates
    const photosByBar = {};
    const weekends = new Set();

    console.log(`r2Routes: got ${allObjects.length} objects`);
    if (allObjects.length > 0) {
      console.log(`Sample object:`, allObjects[0]);
    }

    for (const obj of allObjects) {
      const key = obj?.key || '';
      const parts = key.split('/');
      const barName = parts[0]; // bar folder is first segment
      const ext = key.toLowerCase().split('.').pop();

      // Skip if no bar folder or doesn't look like an image
      if (!barName || !['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
        continue;
      }

      const uploadedDate = obj?.uploaded ? new Date(obj.uploaded) : new Date();

      const weekend = getWeekendThursday(uploadedDate);
      weekends.add(weekend.getTime());

      if (!photosByBar[barName]) {
        photosByBar[barName] = [];
      }
      photosByBar[barName].push({ obj, weekend, uploadedDate });
    }

    // Find the most recent weekend
    if (weekends.size === 0) {
      return res.json([]);
    }
    const sortedWeekends = Array.from(weekends).sort((a, b) => b - a);
    const latestWeekend = new Date(sortedWeekends[0]);

    // Build album response: one per bar folder (only for latest weekend)
    const albums = [];
    for (const [barName, photos] of Object.entries(photosByBar)) {
      // Filter to only photos from the latest weekend
      const latestWeekendPhotos = photos.filter(
        (p) => p.weekend.getTime() === latestWeekend.getTime()
      );
      if (latestWeekendPhotos.length === 0) continue;

      // Pick the most recent photo as cover
      const cover = latestWeekendPhotos.reduce((latest, current) => {
        return current.uploadedDate > latest.uploadedDate ? current : latest;
      });

      albums.push({
        id: barName,
        name: barName,
        barName: barName,
        date: latestWeekend.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
        coverUrl: urlForKey(cover.obj.key),
        albumUri: `${barName}/`, // prefix for photos in this bar
      });
    }

    // Return all bars with photos from the latest weekend, sorted by bar name
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
 * Returns array of {id, image: {uri}}.
 */
router.get('/photos', async (req, res) => {
  try {
    const prefix = req.query.prefix || '';
    if (!prefix) {
      return res.status(400).json({ error: 'Missing prefix query param' });
    }

    let normalizedPrefix = prefix.replace(/^\//, '');
    if (!normalizedPrefix.endsWith('/')) {
      normalizedPrefix = `${normalizedPrefix}/`;
    }

    const objs = await listR2Objects(normalizedPrefix, 5000);
    if (!objs || objs.length === 0) {
      return res.json([]);
    }

    // Filter to image files
    const photos = objs
      .filter((o) => {
        const key = o?.key || '';
        return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(key.toLowerCase().split('.').pop());
      })
      .map((o) => ({
        id: o.key,
        image: { uri: urlForKey(o.key) },
      }));

    res.json(photos);
  } catch (err) {
    console.error('Error fetching photos:', err);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

module.exports = router;
