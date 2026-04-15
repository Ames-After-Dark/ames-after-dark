const { getServiceContainer } = require('../../infrastructure/ServiceContainer');
const { CreateUserDTO, UpdateUserProfileDTO } = require('../../application/dtos/UserDTO');

/**
 * DDD-refactored User Controller
 * Following the layered architecture pattern
 */
class UserController {
  constructor() {
    this.userService = getServiceContainer().getUserApplicationService();
  }

  /**
   * POST /api/users
   * Create new user (registration)
   */
  async createUser(req, res) {
    try {
      const { uid, email, username, name, bio } = req.body;

      const createDTO = new CreateUserDTO(uid, email, username, { name, bio });
      const user = await this.userService.createUser(createDTO);
      res.status(201).json(user);
    } catch (err) {
      console.error('Error creating user:', err);
      res.status(400).json({ message: err.message });
    }
  }

  /**
   * GET /api/users/:id
   * Get user by ID
   */
  async getUserById(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      const user = await this.userService.getUserById(id);
      res.json(user);
    } catch (err) {
      if (err.message.includes('not found')) {
        return res.status(404).json({ message: err.message });
      }
      console.error('Error fetching user:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * GET /api/users/uid/:uid
   * Get user by Auth0 UID
   */
  async getUserByUid(req, res) {
    try {
      const { uid } = req.params;
      const user = await this.userService.getUserByUid(uid);
      res.json(user);
    } catch (err) {
      if (err.message.includes('not found')) {
        return res.status(404).json({ message: err.message });
      }
      console.error('Error fetching user:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * PUT /api/users/:id/profile
   * Update user profile
   */
  async updateProfile(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      const updateDTO = new UpdateUserProfileDTO(id, req.body);
      const user = await this.userService.updateUserProfile(id, updateDTO);
      res.json(user);
    } catch (err) {
      if (err.message.includes('not found')) {
        return res.status(404).json({ message: err.message });
      }
      console.error('Error updating profile:', err);
      res.status(400).json({ message: err.message });
    }
  }

  /**
   * GET /api/users/search
   * Search users
   */
  async searchUsers(req, res) {
    try {
      const { q } = req.query;
      if (!q || q.trim().length === 0) {
        return res.status(400).json({ message: 'Search query required' });
      }

      const users = await this.userService.searchUsers(q);
      res.json(users);
    } catch (err) {
      console.error('Error searching users:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * POST /api/users/:id/favorites/:locationId
   * Add favorite location
   */
  async addFavorite(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      const locationId = parseInt(req.params.locationId, 10);

      if (isNaN(userId) || isNaN(locationId)) {
        return res.status(400).json({ message: 'Invalid IDs' });
      }

      const user = await this.userService.addFavoriteLocation(userId, locationId);
      res.json(user);
    } catch (err) {
      if (err.message.includes('not found')) {
        return res.status(404).json({ message: err.message });
      }
      console.error('Error adding favorite:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * DELETE /api/users/:id/favorites/:locationId
   * Remove favorite location
   */
  async removeFavorite(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      const locationId = parseInt(req.params.locationId, 10);

      if (isNaN(userId) || isNaN(locationId)) {
        return res.status(400).json({ message: 'Invalid IDs' });
      }

      const user = await this.userService.removeFavoriteLocation(
        userId,
        locationId
      );
      res.json(user);
    } catch (err) {
      if (err.message.includes('not found')) {
        return res.status(404).json({ message: err.message });
      }
      console.error('Error removing favorite:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * DELETE /api/users/:id
   * Delete user
   */
  async deleteUser(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      await this.userService.deleteUser(id);
      res.status(204).send();
    } catch (err) {
      if (err.message.includes('not found')) {
        return res.status(404).json({ message: err.message });
      }
      console.error('Error deleting user:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}

module.exports = UserController;
