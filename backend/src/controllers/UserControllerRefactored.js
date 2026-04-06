/**
 * Refactored User Controller
 * Handles user profile, settings, and relationships
 */

const {
  CreateUserDTO,
  UserResponseDTO,
  UserProfileDTO,
} = require('../dtos');
const {
  InvalidUserError,
  AggregateNotFoundError,
  BusinessRuleViolationError,
} = require('../domain/errors');

class UserController {
  constructor(userDomainService) {
    this.userService = userDomainService;
  }

  // ============ Profile Queries ============

  async getUserById(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

      const user = await this.userService.getUserById(userId);
      return res.json(new UserProfileDTO(user));
    } catch (error) {
      if (error instanceof AggregateNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ============ User Profile Commands ============

  async updateUserProfile(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

      const command = {
        username: req.body.username,
        email: req.body.email,
        bio: req.body.bio,
      };

      const user = await this.userService.updateUserProfile(userId, command);
      return res.json(new UserProfileDTO(user));
    } catch (error) {
      if (error instanceof AggregateNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof InvalidUserError) {
        return res.status(400).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateUserSettings(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

      const settings = req.body;
      const user = await this.userService.updateUserSettings(userId, settings);
      return res.json(new UserProfileDTO(user));
    } catch (error) {
      if (error instanceof AggregateNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof BusinessRuleViolationError) {
        return res.status(400).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ============ Ghost Mode Commands ============

  async enableGhostMode(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

      const durationMinutes = req.body?.durationMinutes || 60;
      const user = await this.userService.enableGhostMode(userId, durationMinutes);
      return res.json(new UserProfileDTO(user));
    } catch (error) {
      if (error instanceof AggregateNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof BusinessRuleViolationError) {
        return res.status(400).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async disableGhostMode(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

      const user = await this.userService.disableGhostMode(userId);
      return res.json(new UserProfileDTO(user));
    } catch (error) {
      if (error instanceof AggregateNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ============ Location Sharing Commands ============

  async updateLocationSharingMode(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

      const mode = req.body?.mode; // PUBLIC | PRIVATE | SELECTIVE
      if (!mode) return res.status(400).json({ error: 'Sharing mode required' });

      const user = await this.userService.updateLocationSharingMode(userId, mode);
      return res.json(new UserProfileDTO(user));
    } catch (error) {
      if (error instanceof AggregateNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof BusinessRuleViolationError) {
        return res.status(400).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ============ Favorite Locations Commands ============

  async addFavoriteLocation(req, res) {
    try {
      const userId = parseInt(req.params.userId, 10);
      if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

      const locationId = req.body?.locationId;
      if (!locationId) return res.status(400).json({ error: 'Location ID required' });

      const user = await this.userService.addFavoriteLocation(userId, locationId);
      return res.json(new UserProfileDTO(user));
    } catch (error) {
      if (error instanceof AggregateNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async removeFavoriteLocation(req, res) {
    try {
      const userId = parseInt(req.params.userId, 10);
      if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

      const locationId = req.body?.locationId;
      if (!locationId) return res.status(400).json({ error: 'Location ID required' });

      const user = await this.userService.removeFavoriteLocation(userId, locationId);
      return res.json(new UserProfileDTO(user));
    } catch (error) {
      if (error instanceof AggregateNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ============ Friendship Commands ============

  async sendFriendRequest(req, res) {
    try {
      const userId = parseInt(req.params.userId, 10);
      if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

      const targetUserId = req.body?.targetUserId;
      if (!targetUserId) return res.status(400).json({ error: 'Target user ID required' });

      const targetUser = await this.userService.sendFriendRequest(userId, targetUserId);
      return res.json({ message: 'Friend request sent' });
    } catch (error) {
      if (error instanceof AggregateNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof BusinessRuleViolationError) {
        return res.status(400).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async acceptFriendRequest(req, res) {
    try {
      const userId = parseInt(req.params.userId, 10);
      if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

      const requesterUserId = req.params.requesterId;
      if (!requesterUserId) return res.status(400).json({ error: 'Requester ID required' });

      await this.userService.acceptFriendRequest(userId, requesterUserId);
      return res.json({ message: 'Friend request accepted' });
    } catch (error) {
      if (error instanceof AggregateNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof BusinessRuleViolationError) {
        return res.status(400).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async declineFriendRequest(req, res) {
    try {
      const userId = parseInt(req.params.userId, 10);
      if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

      const requesterUserId = req.params.requesterId;
      if (!requesterUserId) return res.status(400).json({ error: 'Requester ID required' });

      const user = await this.userService.declineFriendRequest(userId, requesterUserId);
      return res.json({ message: 'Friend request declined' });
    } catch (error) {
      if (error instanceof AggregateNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof BusinessRuleViolationError) {
        return res.status(400).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async removeFriend(req, res) {
    try {
      const userId = parseInt(req.params.userId, 10);
      if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

      const friendUserId = req.params.friendId;
      if (!friendUserId) return res.status(400).json({ error: 'Friend ID required' });

      await this.userService.removeFriend(userId, friendUserId);
      return res.json({ message: 'Friend removed' });
    } catch (error) {
      if (error instanceof AggregateNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = UserController;
