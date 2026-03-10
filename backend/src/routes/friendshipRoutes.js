const express = require('express');
const router = express.Router();
const friendshipController = require('../controllers/friendshipController');

// Get all friends for a user
router.get('/:userId/friends', friendshipController.getFriends);
// Send a friend request
router.post('/:userId/friends/:friendId', friendshipController.sendFriendRequest);
// Accept a friend request
router.post('/:userId/friends/:friendId/accept', friendshipController.acceptFriendRequest);
// Decline a friend request
router.post('/:userId/friends/:friendId/decline', friendshipController.declineFriendRequest);
// Block a friend
router.post('/:userId/friends/:friendId/block', friendshipController.blockFriend);
// Remove a friend
router.delete('/:userId/friends/:friendId', friendshipController.removeFriend);
// Get pending friend requests
router.get('/:userId/friend-requests', friendshipController.getPendingRequests);
// Get friends' locations
router.get('/:userId/friends/locations', friendshipController.getFriendsLocations);

// Get recommended friends
router.get('/:userId/recommended-friends', friendshipController.getRecommendedFriends);

module.exports = router;
