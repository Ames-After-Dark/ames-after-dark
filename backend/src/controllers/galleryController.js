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
    res.set('Cache-Control', 'public, max-age=1800');
    res.redirect(url);
  } catch (err) {
    if (err?.name === 'NoSuchKey' || err?.$metadata?.httpStatusCode === 404) {
      return res.status(404).json({ error: 'Photo not found' });
    }
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
