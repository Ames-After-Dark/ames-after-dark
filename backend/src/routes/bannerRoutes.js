const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { checkJwt } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Banners
 *     description: API announcements and promotional banners
 */

/**
 * @swagger
 * /api/banners:
 *   post:
 *     summary: Create a new banner
 *     description: Creates a new promotional or informational banner
 *     tags:
 *       - Banners
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - startDate
 *               - endDate
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               imageUrl:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [info, warning, promotion]
 *     responses:
 *       201:
 *         description: Banner created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', checkJwt, bannerController.createBanner);

/**
 * @swagger
 * /api/banners/upload-url:
 *   post:
 *     summary: Get a presigned R2 upload URL for a banner image
 *     description: Returns a short-lived presigned PUT URL for uploading a banner image directly to the (publicly readable) banners R2 bucket, plus the public URL to store as the banner's image_url once the upload completes.
 *     tags:
 *       - Banners
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filename
 *               - contentType
 *             properties:
 *               filename:
 *                 type: string
 *               contentType:
 *                 type: string
 *                 enum: [image/jpeg, image/png, image/webp, image/gif]
 *     responses:
 *       200:
 *         description: Presigned upload URL generated
 *       400:
 *         description: Invalid filename or content type
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.post('/upload-url', checkJwt, bannerController.getBannerUploadUrl);

/**
 * @swagger
 * /api/banners/active:
 *   get:
 *     summary: Get active banners
 *     description: Retrieves all currently active banners
 *     tags:
 *       - Banners
 *     responses:
 *       200:
 *         description: Active banners retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   content:
 *                     type: string
 *                   type:
 *                     type: string
 *                   startDate:
 *                     type: string
 *                     format: date-time
 *                   endDate:
 *                     type: string
 *                     format: date-time
 *                   imageUrl:
 *                     type: string
 *       500:
 *         description: Server error
 */
router.get('/active', bannerController.getActiveBanners);

/**
 * @swagger
 * /api/banners:
 *   get:
 *     summary: Get all banners
 *     description: Retrieves every banner (active or not), including its linked deal/event if any. Used by the admin portal's banner management page.
 *     tags:
 *       - Banners
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All banners retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get('/', checkJwt, bannerController.getAllBanners);

/**
 * @swagger
 * /api/banners/{id}:
 *   get:
 *     summary: Get banner by ID
 *     description: Retrieves a specific banner by ID
 *     tags:
 *       - Banners
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Banner ID
 *     responses:
 *       200:
 *         description: Banner retrieved successfully
 *       404:
 *         description: Banner not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update banner
 *     description: Updates a banner's name and/or image_url
 *     tags:
 *       - Banners
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Banner ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               image_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Banner updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Banner not found
 *       409:
 *         description: A banner with this name already exists
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete banner
 *     description: Deletes a banner, unlinking it from any deal/event first, and best-effort removes its image from R2
 *     tags:
 *       - Banners
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Banner ID
 *     responses:
 *       204:
 *         description: Banner deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Banner not found
 *       500:
 *         description: Server error
 */
router.get('/:id', bannerController.getBannerById);
router.put('/:id', checkJwt, bannerController.updateBanner);
router.delete('/:id', checkJwt, bannerController.deleteBanner);

/**
 * @swagger
 * /api/banners/date-range:
 *   post:
 *     summary: Get banners by date range
 *     description: Retrieves banners that were active during a specific date range
 *     tags:
 *       - Banners
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startDate
 *               - endDate
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Banners retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   content:
 *                     type: string
 *                   startDate:
 *                     type: string
 *                     format: date-time
 *                   endDate:
 *                     type: string
 *                     format: date-time
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/date-range', bannerController.getBannersByDateRange);

module.exports = router;