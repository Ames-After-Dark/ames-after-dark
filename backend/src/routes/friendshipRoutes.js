const express = require('express');
const router = express.Router();
const friendshipController = require('../controllers/friendshipController');
const { checkJwt } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Friendships
 *     description: User friendship and social operations
 */

/**
 * @swagger
 * /api/friendships/friends:
 *   get:
 *     summary: Get all friends
 *     description: Retrieves the list of friends for the authenticated user
 *     tags:
 *       - Friendships
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Friends list retrieved successfully
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
router.get('/friends', checkJwt, friendshipController.getFriends);


// Get accepted friends for one of your friends
router.get('/friends/:friendId/friends', checkJwt, friendshipController.getFriendsOfFriend);


/**
 * @swagger
 * /api/friendships/friends/{friendId}:
 *   post:
 *     summary: Send friend request
 *     description: Sends a friend request to another user
 *     tags:
 *       - Friendships
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: friendId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID of the friend to request
 *     responses:
 *       201:
 *         description: Friend request sent successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/friends/:friendId', checkJwt, friendshipController.sendFriendRequest);

/**
 * @swagger
 * /api/friendships/friends/{friendId}/accept:
 *   post:
 *     summary: Accept friend request
 *     description: Accepts a pending friend request from another user
 *     tags:
 *       - Friendships
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: friendId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID of the friend request to accept
 *     responses:
 *       200:
 *         description: Friend request accepted successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/friends/:friendId/accept', checkJwt, friendshipController.acceptFriendRequest);

/**
 * @swagger
 * /api/friendships/friends/{friendId}/decline:
 *   post:
 *     summary: Decline friend request
 *     description: Declines a pending friend request from another user
 *     tags:
 *       - Friendships
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: friendId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID of the friend request to decline
 *     responses:
 *       200:
 *         description: Friend request declined successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/friends/:friendId/decline', checkJwt, friendshipController.declineFriendRequest);

/**
 * @swagger
 * /api/friendships/friends/{friendId}/block:
 *   post:
 *     summary: Block a friend
 *     description: Blocks another user, preventing them from interacting
 *     tags:
 *       - Friendships
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: friendId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID of the user to block
 *     responses:
 *       200:
 *         description: User blocked successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/friends/:friendId/block', checkJwt, friendshipController.blockFriend);

/**
 * @swagger
 * /api/friendships/friends/{friendId}:
 *   delete:
 *     summary: Remove a friend
 *     description: Removes an existing friend relationship
 *     tags:
 *       - Friendships
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: friendId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID of the friend to remove
 *     responses:
 *       204:
 *         description: Friend removed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete('/friends/:friendId', checkJwt, friendshipController.removeFriend);

/**
 * @swagger
 * /api/friendships/friend-requests:
 *   get:
 *     summary: Get pending friend requests
 *     description: Retrieves all pending friend requests for the authenticated user
 *     tags:
 *       - Friendships
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Pending requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   from:
 *                     $ref: '#/components/schemas/User'
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/friend-requests', checkJwt, friendshipController.getPendingRequests);

/**
 * @swagger
 * /api/friendships/mutual-friends/{friendId}:
 *   get:
 *     summary: Get mutual friends
 *     description: Retrieves mutual friends with another user
 *     tags:
 *       - Friendships
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: friendId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to find mutual friends with
 *     responses:
 *       200:
 *         description: Mutual friends retrieved successfully
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
router.get('/mutual-friends/:friendId', checkJwt, friendshipController.getMutualFriends);

/**
 * @swagger
 * /api/friendships/recommended-friends:
 *   get:
 *     summary: Get recommended friends
 *     description: Retrieves friend recommendations based on mutual connections
 *     tags:
 *       - Friendships
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Recommended friends retrieved successfully
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
router.get('/recommended-friends', checkJwt, friendshipController.getRecommendedFriends);

module.exports = router;
