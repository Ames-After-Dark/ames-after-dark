/**
 * User Response DTO
 * Safe user data for sending to clients (no sensitive info)
 */
class UserResponseDTO {
  constructor(
    id,
    username,
    email,
    name,
    bio,
    streak,
    friendCount,
    favoriteCount,
    isAdmin,
    isDeveloper
  ) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.name = name;
    this.bio = bio;
    this.streak = streak;
    this.friendCount = friendCount;
    this.favoriteCount = favoriteCount;
    this.isAdmin = isAdmin;
    this.isDeveloper = isDeveloper;
  }

  static fromDomain(user) {
    return new UserResponseDTO(
      user.id,
      user.username,
      user.email ? user.email.value : null,
      user.name,
      user.bio,
      user.streak,
      user.getFriendCount(),
      user.favoriteLocations.size,
      user.isAdmin(),
      user.isDeveloper()
    );
  }
}

/**
 * Create User Request DTO
 */
class CreateUserDTO {
  constructor(uid, email, username, props = {}) {
    this.uid = uid;
    this.email = email;
    this.username = username;
    this.name = props.name;
    this.bio = props.bio;
  }

  validate() {
    if (!this.uid || this.uid.trim().length === 0) {
      throw new Error('Auth0 UID is required');
    }
    if (!this.email || this.email.trim().length === 0) {
      throw new Error('Email is required');
    }
    if (!this.username || this.username.trim().length === 0) {
      throw new Error('Username is required');
    }
    return true;
  }
}

/**
 * Update User Profile Request DTO
 */
class UpdateUserProfileDTO {
  constructor(userId, props = {}) {
    this.userId = userId;
    this.username = props.username;
    this.bio = props.bio;
    this.name = props.name;
    this.phoneNumber = props.phoneNumber;
  }
}

module.exports = {
  UserResponseDTO,
  CreateUserDTO,
  UpdateUserProfileDTO,
};
