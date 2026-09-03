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
