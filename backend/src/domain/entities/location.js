/**
 * Location Entity - Aggregate Root
 * Represents a bar or venue
 */
class Location {
  constructor(id, name, address, latitude, longitude, createdAt = new Date()) {
    this.validate(name, address, latitude, longitude);
    
    this.id = id;
    this.name = name;
    this.address = address;
    this.latitude = latitude;
    this.longitude = longitude;
    this.createdAt = new Date(createdAt);
    this.views = 0;
    
    // Child aggregates - managed within Location aggregate
    this.hours = null;
    this.menuItems = [];
    this.deals = [];
    this.events = [];
  }

  validate(name, address, latitude, longitude) {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new Error('Location name is required');
    }
    if (!address || typeof address !== 'string' || address.trim() === '') {
      throw new Error('Location address is required');
    }
    if (latitude === null || latitude === undefined || isNaN(Number(latitude))) {
      throw new Error('Location latitude is required');
    }
    if (longitude === null || longitude === undefined || isNaN(Number(longitude))) {
      throw new Error('Location longitude is required');
    }
  }

  recordView() {
    this.views++;
  }

  updateBasicInfo(name, address, latitude, longitude) {
    this.validate(name, address, latitude, longitude);
    this.name = name;
    this.address = address;
    this.latitude = latitude;
    this.longitude = longitude;
  }

  setHours(hours) {
    this.hours = hours;
  }

  isOpenAt(dateTime) {
    if (!this.hours) {
      return false;
    }

    // Check overrides first
    const override = this.hours.getOverrideAt(dateTime);
    if (override) {
      return override.isOpen;
    }

    // Check regular hours
    return this.hours.isOpenAt(dateTime);
  }

  addMenuItem(menuItem) {
    if (!this.menuItems.find(m => m.id.equals(menuItem.id))) {
      this.menuItems.push(menuItem);
    }
  }

  removeMenuItem(menuItemId) {
    this.menuItems = this.menuItems.filter(m => !m.id.equals(menuItemId));
  }

  addDeal(deal) {
    if (!this.deals.find(d => d.id.equals(deal.id))) {
      this.deals.push(deal);
    }
  }

  addEvent(event) {
    if (!this.events.find(e => e.id.equals(event.id))) {
      this.events.push(event);
    }
  }

  getActiveDealsBetween(startDate, endDate) {
    return this.deals.filter(d => 
      d.isActive && d.occurrences.some(o => o.overlaps({
        startDate,
        endDate
      }))
    );
  }

  getActiveEventsBetween(startDate, endDate) {
    return this.events.filter(e => 
      e.isActive && e.occurrences.some(o => o.overlaps({
        startDate,
        endDate
      }))
    );
  }

  toPersistence() {
    return {
      id: this.id.value,
      name: this.name,
      address: this.address,
      latitude: this.latitude,
      longitude: this.longitude,
      created_at: this.createdAt,
      views: this.views,
    };
  }

  static fromPersistence(data) {
    const { EntityIds } = require('../valueObjects');
    const location = new Location(
      EntityIds.locationId(data.id),
      data.name,
      data.address,
      data.latitude,
      data.longitude,
      data.created_at
    );
    location.views = data.views || 0;
    return location;
  }
}

/**
 * User Entity - Aggregate Root
 * Represents a user with their profile and preferences
 */
class User {
  constructor(id, auth0Id, username, email, createdAt = new Date()) {
    const { Username, Email } = require('../valueObjects');
    
    this.id = id;
    this.auth0Id = auth0Id;
    this.username = new Username(username);
    this.email = new Email(email);
    this.createdAt = new Date(createdAt);
    
    // User profile information
    this.bio = null;
    this.profilePhotoId = null;
    this.favoriteDrinkId = null;
    this.favoriteLocationId = null;
    
    // User preferences (child aggregate)
    this.settings = {
      soundEnabled: true,
      notificationsEnabled: true,
      locationSharingMode: 'SELECTIVE', // PUBLIC, PRIVATE, SELECTIVE
      ghostModeUntil: null,
    };
    
    // User relationships
    this.favoriteLocationIds = [];
    this.friends = [];
    this.pendingFriendRequests = [];
  }

  updateProfile(username, email, bio) {
    const { Username, Email } = require('../valueObjects');
    this.username = new Username(username);
    this.email = new Email(email);
    this.bio = bio;
  }

  updateSettings(settings) {
    this.settings = {
      ...this.settings,
      ...settings,
    };
  }

  toggleLocationShare(mode) {
    const validModes = ['PUBLIC', 'PRIVATE', 'SELECTIVE'];
    if (!validModes.includes(mode)) {
      throw new Error(`Invalid location sharing mode: ${mode}`);
    }
    this.settings.locationSharingMode = mode;
  }

  enableGhostMode(durationMinutes) {
    const until = new Date();
    until.setMinutes(until.getMinutes() + durationMinutes);
    this.settings.ghostModeUntil = until;
  }

  disableGhostMode() {
    this.settings.ghostModeUntil = null;
  }

  isInGhostMode() {
    if (!this.settings.ghostModeUntil) {
      return false;
    }
    return new Date() < this.settings.ghostModeUntil;
  }

  addFavoriteLocation(locationId) {
    if (!this.favoriteLocationIds.includes(locationId.value)) {
      this.favoriteLocationIds.push(locationId.value);
    }
  }

  removeFavoriteLocation(locationId) {
    this.favoriteLocationIds = this.favoriteLocationIds.filter(id => 
      id !== locationId.value
    );
  }

  isFavorite(locationId) {
    return this.favoriteLocationIds.includes(locationId.value);
  }

  addFriend(userId) {
    if (!this.friends.includes(userId.value)) {
      this.friends.push(userId.value);
    }
  }

  removeFriend(userId) {
    this.friends = this.friends.filter(id => id !== userId.value);
  }

  isFriendWith(userId) {
    return this.friends.includes(userId.value);
  }

  addPendingFriendRequest(userId) {
    if (!this.pendingFriendRequests.includes(userId.value)) {
      this.pendingFriendRequests.push(userId.value);
    }
  }

  removePendingFriendRequest(userId) {
    this.pendingFriendRequests = this.pendingFriendRequests.filter(id => 
      id !== userId.value
    );
  }

  hasPendingRequestFrom(userId) {
    return this.pendingFriendRequests.includes(userId.value);
  }

  toPersistence() {
    return {
      id: this.id.value,
      auth0_id: this.auth0Id.value,
      username: this.username.value,
      email: this.email.value,
      bio: this.bio,
      profile_photo_id: this.profilePhotoId,
      favorite_drink_id: this.favoriteDrinkId,
      favorite_profile_location_id: this.favoriteLocationId,
      created_at: this.createdAt,
    };
  }

  static fromPersistence(data) {
    const { EntityIds } = require('../valueObjects');
    const user = new User(
      EntityIds.userId(data.id),
      EntityIds.auth0Id(data.auth0_id),
      data.username,
      data.email,
      data.created_at
    );
    user.bio = data.bio;
    user.profilePhotoId = data.profile_photo_id;
    user.favoriteDrinkId = data.favorite_drink_id;
    user.favoriteLocationId = data.favorite_profile_location_id;
    return user;
  }
}

module.exports = {
  Location,
  User,
};
