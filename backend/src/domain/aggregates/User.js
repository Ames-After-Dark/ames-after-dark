const AggregateRoot = require('../../shared/AggregateRoot');
const Email = require('../value-objects/Email');
const {
  UserCreatedEvent,
  UserProfileUpdatedEvent,
  LocationFavoritedEvent,
  LocationUnfavoritedEvent,
} = require('../events/UserEvents');

/**
 * User Aggregate Root
 * Represents a user in the Ames After Dark system
 * Encapsulates all business logic for user management
 */
class User extends AggregateRoot {
  constructor(id, uid, props = {}) {
    super(id, props);
    this.uid = uid; // Auth0 ID
    this.username = props.username || null;
    this.email = props.email ? new Email(props.email) : null;
    this.name = props.name || null;
    this.bio = props.bio || null;
    this.birthday = props.birthday || null;
    this.phoneNumber = props.phoneNumber || null;
    this.streak = props.streak || 0;
    this.lastStreakWeek = props.lastStreakWeek || null;
    this.lastStreakYear = props.lastStreakYear || null;
    this.roleId = props.roleId || null;
    this.profilePhotoId = props.profilePhotoId || null;
    this.favoriteDrinkId = props.favoriteDrinkId || null;
    this.favoriteLocationId = props.favoriteLocationId || null;
    this.favoriteLocations = new Set(props.favoriteLocationIds || []);
    this.friends = new Set(props.friendIds || []);
  }

  /**
   * Factory method to create a new user
   */
  static create(id, uid, email, username, props = {}) {
    const user = new User(id, uid, {
      ...props,
      email,
      username,
    });
    user.publishEvent(new UserCreatedEvent(user, username, email));
    return user;
  }

  /**
   * Update user profile information
   */
  updateProfile(profileData) {
    const changedFields = {};

    if (profileData.username && profileData.username !== this.username) {
      this.username = profileData.username;
      changedFields.username = profileData.username;
    }

    if (profileData.bio && profileData.bio !== this.bio) {
      this.bio = profileData.bio;
      changedFields.bio = profileData.bio;
    }

    if (profileData.name && profileData.name !== this.name) {
      this.name = profileData.name;
      changedFields.name = profileData.name;
    }

    if (profileData.phoneNumber && profileData.phoneNumber !== this.phoneNumber) {
      this.phoneNumber = profileData.phoneNumber;
      changedFields.phoneNumber = profileData.phoneNumber;
    }

    if (profileData.birthday && profileData.birthday !== this.birthday) {
      this.birthday = profileData.birthday;
      changedFields.birthday = profileData.birthday;
    }

    if (profileData.profilePhotoId && profileData.profilePhotoId !== this.profilePhotoId) {
      this.profilePhotoId = profileData.profilePhotoId;
      changedFields.profilePhotoId = profileData.profilePhotoId;
    }

    if (profileData.favoriteDrinkId && profileData.favoriteDrinkId !== this.favoriteDrinkId) {
      this.favoriteDrinkId = profileData.favoriteDrinkId;
      changedFields.favoriteDrinkId = profileData.favoriteDrinkId;
    }

    if (Object.keys(changedFields).length > 0) {
      this.updatedAt = new Date();
      this.publishEvent(new UserProfileUpdatedEvent(this, changedFields));
    }
  }

  /**
   * Add a favorite location
   */
  addFavoriteLocation(locationId) {
    if (!this.favoriteLocations.has(locationId)) {
      this.favoriteLocations.add(locationId);
      this.publishEvent(new LocationFavoritedEvent(this, locationId));
      return true;
    }
    return false;
  }

  /**
   * Remove a favorite location
   */
  removeFavoriteLocation(locationId) {
    if (this.favoriteLocations.has(locationId)) {
      this.favoriteLocations.delete(locationId);
      this.publishEvent(new LocationUnfavoritedEvent(this, locationId));
      return true;
    }
    return false;
  }

  /**
   * Toggle favorite status
   */
  toggleFavoriteLocation(locationId) {
    if (this.favoriteLocations.has(locationId)) {
      return this.removeFavoriteLocation(locationId);
    } else {
      return this.addFavoriteLocation(locationId);
    }
  }

  /**
   * Check if location is favorited
   */
  hasFavorited(locationId) {
    return this.favoriteLocations.has(locationId);
  }

  /**
   * Get all favorite locations
   */
  getFavoriteLocations() {
    return Array.from(this.favoriteLocations);
  }

  /**
   * Add a friend
   */
  addFriend(friendId) {
    if (!this.friends.has(friendId) && friendId !== this.id) {
      this.friends.add(friendId);
      return true;
    }
    return false;
  }

  /**
   * Remove a friend
   */
  removeFriend(friendId) {
    return this.friends.delete(friendId);
  }

  /**
   * Check if user is friends with someone
   */
  isFriendsWith(userId) {
    return this.friends.has(userId);
  }

  /**
   * Get friend count
   */
  getFriendCount() {
    return this.friends.size;
  }

  /**
   * Increment streak
   */
  incrementStreak(weekNumber, year) {
    this.streak += 1;
    this.lastStreakWeek = weekNumber;
    this.lastStreakYear = year;
  }

  /**
   * Reset streak
   */
  resetStreak() {
    this.streak = 0;
    this.lastStreakWeek = null;
    this.lastStreakYear = null;
  }

  /**
   * Check if user is an admin
   */
  isAdmin() {
    return this.roleId === 2; // adjust based on your role schema
  }

  /**
   * Check if user is a developer
   */
  isDeveloper() {
    return this.roleId === 3; // adjust based on your role schema
  }

  /**
   * Convert to domain object
   */
  toObject() {
    return {
      id: this.id,
      uid: this.uid,
      username: this.username,
      email: this.email ? this.email.value : null,
      name: this.name,
      bio: this.bio,
      birthday: this.birthday,
      phoneNumber: this.phoneNumber,
      streak: this.streak,
      lastStreakWeek: this.lastStreakWeek,
      lastStreakYear: this.lastStreakYear,
      roleId: this.roleId,
      profilePhotoId: this.profilePhotoId,
      favoriteDrinkId: this.favoriteDrinkId,
      favoriteLocationId: this.favoriteLocationId,
      favoriteLocations: this.getFavoriteLocations(),
      friendCount: this.getFriendCount(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = User;
