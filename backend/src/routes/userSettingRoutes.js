const express = require('express');
const router = express.Router();
const userSettingController = require('../controllers/userSettingController');
const { checkJwt } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: User authentication and profile operations
 */

/**
 * @swagger
 * /api/usersettings/me:
 *   get:
 *     summary: Get authenticated user's settings
 *     description: Retrieves all settings for the currently authenticated user
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: boolean
 *                 privacyLevel:
 *                   type: string
 *                   enum: [public, private, selective]
 *                 themePreference:
 *                   type: string
 *                   enum: [light, dark, system]
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update authenticated user's settings
 *     description: Updates settings for the currently authenticated user
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
 *             properties:
 *               notifications:
 *                 type: boolean
 *               privacyLevel:
 *                 type: string
 *                 enum: [public, private, selective]
 *               themePreference:
 *                 type: string
 *                 enum: [light, dark, system]
 *     responses:
 *       200:
 *         description: User settings updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/me', checkJwt, userSettingController.getUserSettings);
router.put('/me', checkJwt, userSettingController.updateUserSettings);

module.exports = router;
