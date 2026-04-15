const express = require('express');
const router = express.Router();
const userLocationController = require('../controllers/userLocationController');
const { checkJwt } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: User authentication and profile operations
 */

/**
 * @swagger
 * /api/userlocations/me:
 *   get:
 *     summary: Get authenticated user's current location
 *     description: Retrieves the current location of the authenticated user
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User location retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 latitude:
 *                   type: number
 *                 longitude:
 *                   type: number
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update authenticated user's location
 *     description: Updates the current location for the authenticated user
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: User location updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/me', checkJwt, userLocationController.getUserLocation);
router.put('/me', checkJwt, userLocationController.updateUserLocation);

/**
 * @swagger
 * /api/userlocations/me/friends/locations:
 *   get:
 *     summary: Get friends' locations
 *     description: Retrieves the current locations of all friends
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Friends' locations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: string
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/me/friends/locations', checkJwt, userLocationController.getFriendsLocations);

/**
 * @swagger
 * /api/userlocations/permissions/{viewerId}:
 *   post:
 *     summary: Toggle location sharing with a friend
 *     description: Enables or disables location sharing for a specific friend
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: viewerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Friend user ID
 *     responses:
 *       200:
 *         description: Location permission toggled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Friend not found
 *       500:
 *         description: Server error
 */
router.post('/permissions/:viewerId', checkJwt, userLocationController.toggleLocationPermission);

/**
 * @swagger
 * /api/userlocations/me/ghost:
 *   post:
 *     summary: Set ghost mode (hide location temporarily)
 *     description: Enables ghost mode to hide your location for a specified number of hours
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hours
 *             properties:
 *               hours:
 *                 type: number
 *                 description: Number of hours to stay in ghost mode
 *     responses:
 *       200:
 *         description: Ghost mode enabled successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/me/ghost', checkJwt, userLocationController.setGhostMode);

/**
 * @swagger
 * /api/userlocations/me/preference:
 *   patch:
 *     summary: Update location sharing preference
 *     description: Updates the general location sharing preference
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - preference
 *             properties:
 *               preference:
 *                 type: string
 *                 enum: [PUBLIC, PRIVATE, SELECTIVE]
 *     responses:
 *       200:
 *         description: Sharing preference updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.patch('/me/preference', checkJwt, userLocationController.updateSharingPreference);

/**
 * @swagger
 * /api/userlocations/checkin/{locationId}:
 *   post:
 *     summary: Check in to a location
 *     description: Records a check-in for the authenticated user at a specific location
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: locationId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ID to check in to
 *     responses:
 *       200:
 *         description: Check-in recorded successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Location not found
 *       500:
 *         description: Server error
 */
router.post('/checkin/:locationId', checkJwt, userLocationController.checkIn);

module.exports = router;
