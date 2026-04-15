const express = require('express');
const router = express.Router();
const userFavoriteController = require('../controllers/userFavoriteController');
const { checkJwt } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Favorites
 *     description: User favorite locations and drinks
 */

/**
 * @swagger
 * /api/userfavorites/{userId}:
 *   get:
 *     summary: Get user's favorites
 *     description: Retrieves all favorite locations and items for a specific user
 *     tags:
 *       - Favorites
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User favorites retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   locationId:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/:userId', userFavoriteController.getUserFavoritesByUserId);

/**
 * @swagger
 * /api/userfavorites/toggle:
 *   post:
 *     summary: Toggle favorite status
 *     description: Adds or removes a favorite for the authenticated user
 *     tags:
 *       - Favorites
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - locationId
 *             properties:
 *               locationId:
 *                 type: string
 *               drinkId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Favorite toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isFavorited:
 *                   type: boolean
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Location or item not found
 *       500:
 *         description: Server error
 */
router.post('/toggle', checkJwt, userFavoriteController.toggleFavorite);

module.exports = router;
