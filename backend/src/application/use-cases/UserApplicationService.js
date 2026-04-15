const User = require('../../domain/aggregates/User');
const { UserResponseDTO, CreateUserDTO } = require('../dtos/UserDTO');

/**
 * Core Application Service for User use cases
 */
class UserApplicationService {
  constructor(userRepository, eventPublisher) {
    this.userRepository = userRepository;
    this.eventPublisher = eventPublisher;
  }

  /**
   * Use case: Create new user
   */
  async createUser(createUserDTO) {
    createUserDTO.validate();

    // Check if email already exists
    const existingByEmail = await this.userRepository.findByEmail(
      createUserDTO.email
    );
    if (existingByEmail) {
      throw new Error('Email already in use');
    }

    // Check if username already exists
    const existingByUsername = await this.userRepository.findByUsername(
      createUserDTO.username
    );
    if (existingByUsername) {
      throw new Error('Username already taken');
    }

    // Generate ID
    const id = Math.floor(Math.random() * 1000000);

    const user = User.create(id, createUserDTO.uid, createUserDTO.email, createUserDTO.username, {
      name: createUserDTO.name,
      bio: createUserDTO.bio,
    });

    const saved = await this.userRepository.save(user);

    // Publish events
    const events = user.getUncommittedEvents();
    for (const event of events) {
      await this.eventPublisher.publish(event);
    }

    return UserResponseDTO.fromDomain(saved);
  }

  /**
   * Use case: Get user by ID
   */
  async getUserById(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    return UserResponseDTO.fromDomain(user);
  }

  /**
   * Use case: Get user by Auth0 UID
   */
  async getUserByUid(uid) {
    const user = await this.userRepository.findByUid(uid);
    if (!user) {
      throw new Error(`User with UID ${uid} not found`);
    }
    return UserResponseDTO.fromDomain(user);
  }

  /**
   * Use case: Update user profile
   */
  async updateUserProfile(userId, updateDTO) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    user.updateProfile(updateDTO);
    const updated = await this.userRepository.save(user);

    // Publish events
    const events = user.getUncommittedEvents();
    for (const event of events) {
      await this.eventPublisher.publish(event);
    }

    return UserResponseDTO.fromDomain(updated);
  }

  /**
   * Use case: Search users
   */
  async searchUsers(query) {
    const users = await this.userRepository.search(query);
    return users.map(user => UserResponseDTO.fromDomain(user));
  }

  /**
   * Use case: Add favorite location
   */
  async addFavoriteLocation(userId, locationId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    user.addFavoriteLocation(locationId);
    const updated = await this.userRepository.save(user);
    await this.userRepository.addFavoriteLocation(userId, locationId);

    // Publish events
    const events = user.getUncommittedEvents();
    for (const event of events) {
      await this.eventPublisher.publish(event);
    }

    return UserResponseDTO.fromDomain(updated);
  }

  /**
   * Use case: Remove favorite location
   */
  async removeFavoriteLocation(userId, locationId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    user.removeFavoriteLocation(locationId);
    const updated = await this.userRepository.save(user);
    await this.userRepository.removeFavoriteLocation(userId, locationId);

    // Publish events
    const events = user.getUncommittedEvents();
    for (const event of events) {
      await this.eventPublisher.publish(event);
    }

    return UserResponseDTO.fromDomain(updated);
  }

  /**
   * Use case: Get user's favorite locations
   */
  async getUserFavorites(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    return user.getFavoriteLocations();
  }

  /**
   * Use case: Delete user
   */
  async deleteUser(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    await this.userRepository.delete(userId);
  }
}

module.exports = UserApplicationService;
