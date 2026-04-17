const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { checkJwt, optionalJwt } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: User authentication and profile operations
 */

/**
 * @swagger
 * /api/users/auth/status:
 *   get:
 *     summary: Check user authentication status
 *     description: Validates Auth0 token if present and returns user status. Does not require authentication.
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: User status retrieved successfully
 *       401:
 *         description: Invalid token
 *       500:
 *         description: Server error
 */
router.get('/auth/status', optionalJwt, userController.checkUserStatus);

/**
 * @swagger
 * /api/users/auth/register:
 *   post:
 *     summary: Complete user registration
 *     description: Completes the registration process after Auth0 authentication
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
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/auth/register', checkJwt, userController.completeUserRegistration);

/**
 * @swagger
 * /api/users/auth/check-username:
 *   get:
 *     summary: Check username availability
 *     description: Checks if a username is available for registration
 *     tags:
 *       - Users
 *     parameters:
 *       - name: username
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Username to check
 *     responses:
 *       200:
 *         description: Username availability status returned
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.get('/auth/check-username', userController.checkUsernameAvailability);

/**
 * @swagger
 * /api/users/auth/username:
 *   get:
 *     summary: Get authenticated user's username
 *     description: Retrieves the username of the currently authenticated user
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Username retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/auth/username', checkJwt, userController.getUsernameByAuth);

/**
 * @swagger
 * /api/users/auth/username:
 *   put:
 *     summary: Update authenticated user's username
 *     description: Updates the username for the currently authenticated user
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
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: Username updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/auth/username', checkJwt, userController.updateUsernameByAuth);

/**
 * @swagger
 * /api/users/auth/name:
 *   put:
 *     summary: Update authenticated user's display name
 *     description: Updates the display name for the currently authenticated user
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
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Display name updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/auth/name', checkJwt, userController.updateUserDisplayName);

/**
 * @swagger
 * /api/users/auth/profile:
 *   get:
 *     summary: Get authenticated user's profile
 *     description: Retrieves detailed profile information for the currently authenticated user
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/auth/profile', checkJwt, userController.getUserProfileByAuth);

/**
 * @swagger
 * /api/users/auth/roles:
 *   get:
 *     summary: Get authenticated user's roles
 *     description: Retrieves admin and developer status for the currently authenticated user
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User roles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isAdmin:
 *                   type: boolean
 *                 isDeveloper:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/auth/roles', checkJwt, userController.getUserRolesByAuth);

/**
 * @swagger
 * /api/users/auth/bio:
 *   put:
 *     summary: Update authenticated user's bio
 *     description: Updates the bio for the currently authenticated user
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
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bio updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/auth/bio', checkJwt, userController.updateBioByAuth);

/**
 * @swagger
 * /api/users/auth/account:
 *   delete:
 *     summary: Delete authenticated user's account
 *     description: Permanently deletes the currently authenticated user's account
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       204:
 *         description: Account deleted successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/auth/account', checkJwt, userController.deleteAccount);

/**
 * @swagger
 * /api/users/auth/cancel-registration:
 *   delete:
 *     summary: Cancel user registration
 *     description: Cancels registration before database user creation
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       204:
 *         description: Registration cancelled successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/auth/cancel-registration', checkJwt, userController.cancelRegistration);

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Search users
 *     description: Search for users by username or other criteria
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: query
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Users found
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/search', checkJwt, userController.searchUsers);

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current authenticated user
 *     description: Retrieves the currently authenticated user's profile
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current user retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/me', checkJwt, userController.getCurrentUser);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Dev only)
 *     description: Retrieves all users in the system. Development endpoint.
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', checkJwt, userController.getUsers);

/**
 * @swagger
 * /api/users/{userId}/friends:
 *   get:
 *     summary: Get user's friends
 *     description: Retrieves the list of friends for a specific user
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User friends retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/:userId/friends', checkJwt, userController.getUserFriends);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieves a specific user's profile by ID
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/:id', checkJwt, userController.getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user profile (limited fields)
 *     description: Updates specific fields of a user's profile
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/:id', checkJwt, userController.updateUserLimited);

/**
 * @swagger
 * /api/users/profile/favorite-drinks:
 *   get:
 *     summary: Get favorite drink options
 *     description: Retrieves all available favorite drink options for user profiles
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: Favorite drink options retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/profile/favorite-drinks', userController.getUserProfileFavoriteDrinkOptions);

/**
 * @swagger
 * /api/users/profile/favorite-drinks/{id}:
 *   get:
 *     summary: Get favorite drink option by ID
 *     description: Retrieves a specific favorite drink option
 *     tags:
 *       - Users
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Drink option ID
 *     responses:
 *       200:
 *         description: Drink option retrieved successfully
 *       404:
 *         description: Drink option not found
 *       500:
 *         description: Server error
 */
router.get('/profile/favorite-drinks/:id', userController.getUserProfileFavoriteDrinkOptionsById);

/**
 * @swagger
 * /api/users/profile/photo-options:
 *   get:
 *     summary: Get profile photo options
 *     description: Retrieves all available profile photo options
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: Photo options retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/profile/photo-options', userController.getUserProfilePhotoOptions);

/**
 * @swagger
 * /api/users/profile/photo-options/{id}:
 *   get:
 *     summary: Get profile photo option by ID
 *     description: Retrieves a specific profile photo option
 *     tags:
 *       - Users
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Photo option ID
 *     responses:
 *       200:
 *         description: Photo option retrieved successfully
 *       404:
 *         description: Photo option not found
 *       500:
 *         description: Server error
 */
router.get('/profile/photo-options/:id', userController.getUserProfilePhotoOptionsById);

/**
 * @swagger
 * /api/users/admins:
 *   get:
 *     summary: Get all admin users
 *     description: Retrieves all users with admin role (role_id = 3). Requires authentication.
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of admin users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/admins', checkJwt, userController.getAdmins);

/**
 * @swagger
 * /api/users/{id}/role:
 *   patch:
 *     summary: Update user's role (developer only)
 *     description: Allows developers (role_id = 4) to update another user's role. Only users with role_id = 4 can access this endpoint.
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleId
 *             properties:
 *               roleId:
 *                 type: integer
 *                 description: The new role ID for the user
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only developers can update roles
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/role', checkJwt, userController.updateUserRole);

module.exports = router;
