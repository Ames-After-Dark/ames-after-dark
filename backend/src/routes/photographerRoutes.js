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
