/**
 * Refactored User Routes
 * DDD-compliant - Clear separation of concerns
 * 
 * Organizational pattern:
 * - Profile: User identity and basic info
 * - Settings: User preferences and modes (ghost mode, privacy)
 * - Favorites: Location favorites (part of User aggregate)
 * - Friendships: Social connections (separate via commands)
 */

const express = require('express');
const router = express.Router();

module.exports = (userController) => {
  // ============ Profile Queries ============

  /**
   * Query: Get user profile
   * GET /api/users/:id
   * 
   * Returns full user profile including settings and relationships
   */
  router.get('/:id', (req, res) => userController.getUserById(req, res));

  // ============ Profile Commands ============

  /**
   * Command: Update user profile
   * PUT /api/users/:id/profile
   * 
   * Request body: { username, email, bio }
   * Updates user identity info
   */
  router.put('/:id/profile', (req, res) => userController.updateUserProfile(req, res));

  // ============ Settings Commands ============

  /**
   * Command: Update user settings
   * PUT /api/users/:id/settings
   * 
   * Request body: { soundEnabled, notificationsEnabled, ... }
   */
  router.put('/:id/settings', (req, res) => userController.updateUserSettings(req, res));

  /**
   * Command: Enable ghost mode
   * POST /api/users/:id/commands/enable-ghost-mode
   * 
   * Request body: { durationMinutes }
   * Explicit command instead of implicit setting change
   */
  router.post('/:id/commands/enable-ghost-mode', (req, res) => 
    userController.enableGhostMode(req, res)
  );

  /**
   * Command: Disable ghost mode
   * POST /api/users/:id/commands/disable-ghost-mode
   * 
   * Explicit command to exit ghost mode
   */
  router.post('/:id/commands/disable-ghost-mode', (req, res) => 
    userController.disableGhostMode(req, res)
  );

  /**
   * Command: Update location sharing mode
   * POST /api/users/:id/commands/set-location-privacy
   * 
   * Request body: { mode: 'PUBLIC' | 'PRIVATE' | 'SELECTIVE' }
   * Explicit command for privacy setting
   */
  router.post('/:id/commands/set-location-privacy', (req, res) => 
    userController.updateLocationSharingMode(req, res)
  );

  // ============ Favorite Locations Commands ============

  /**
   * Command: Add favorite location
   * POST /api/users/:userId/commands/add-favorite
   * 
   * Request body: { locationId }
   * Explicit command to favorite a location
   */
  router.post('/:userId/commands/add-favorite', (req, res) => 
    userController.addFavoriteLocation(req, res)
  );

  /**
   * Command: Remove favorite location
   * POST /api/users/:userId/commands/remove-favorite
   * 
   * Request body: { locationId }
   * Explicit command to un-favorite a location
   */
  router.post('/:userId/commands/remove-favorite', (req, res) => 
    userController.removeFavoriteLocation(req, res)
  );

  // ============ Friendship Commands ============
  // Note: Friendships are a bounded context within User aggregate

  /**
   * Command: Send friend request
   * POST /api/users/:userId/commands/send-friend-request
   * 
   * Request body: { targetUserId }
   * Explicit intent: request friendship
   */
  router.post('/:userId/commands/send-friend-request', (req, res) => 
    userController.sendFriendRequest(req, res)
  );

  /**
   * Command: Accept friend request
   * POST /api/users/:userId/commands/accept-friend-request
   * 
   * Path: /users/:userId/commands/accept-friend-request
   * Request body must include requesterId or use different endpoint
   * 
   * Better pattern would be:
   * POST /api/users/:userId/friend-requests/:requesterId/commands/accept
   */
  router.post('/:userId/commands/accept-friend-request/:requesterId', (req, res) => 
    userController.acceptFriendRequest(req, res)
  );

  /**
   * Command: Decline friend request
   * POST /api/users/:userId/commands/decline-friend-request/:requesterId
   * 
   * Explicit: decline a pending friend request
   */
  router.post('/:userId/commands/decline-friend-request/:requesterId', (req, res) => 
    userController.declineFriendRequest(req, res)
  );

  /**
   * Command: Remove friend
   * POST /api/users/:userId/commands/remove-friend/:friendId
   * 
   * Explicit: end a friendship
   */
  router.post('/:userId/commands/remove-friend/:friendId', (req, res) => 
    userController.removeFriend(req, res)
  );

  return router;
};
