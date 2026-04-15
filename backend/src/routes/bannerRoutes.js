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
 */
router.get('/:id', bannerController.getBannerById);

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