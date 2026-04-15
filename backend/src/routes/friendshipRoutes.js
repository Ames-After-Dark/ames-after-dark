const express = require('express');
const router = express.Router();
const friendshipController = require('../controllers/friendshipController');
const { checkJwt } = require('../middleware/authMiddleware');

// Get all friends for a user
router.get('/friends', checkJwt, friendshipController.getFriends);
// Get accepted friends for one of your friends
router.get('/friends/:friendId/friends', checkJwt, friendshipController.getFriendsOfFriend);
// Send a friend request
router.post('/friends/:friendId', checkJwt, friendshipController.sendFriendRequest);
// Accept a friend request
router.post('/friends/:friendId/accept', checkJwt, friendshipController.acceptFriendRequest);
// Decline a friend request
router.post('/friends/:friendId/decline', checkJwt, friendshipController.declineFriendRequest);
// Block a friend
router.post('/friends/:friendId/block', checkJwt, friendshipController.blockFriend);
// Remove a friend
router.delete('/friends/:friendId', checkJwt, friendshipController.removeFriend);
// Get pending friend requests
router.get('/friend-requests', checkJwt, friendshipController.getPendingRequests);
// Get mutual friends with another user
router.get('/mutual-friends/:friendId', checkJwt, friendshipController.getMutualFriends);
// Get recommended friends
router.get('/recommended-friends', checkJwt, friendshipController.getRecommendedFriends);

module.exports = router;
