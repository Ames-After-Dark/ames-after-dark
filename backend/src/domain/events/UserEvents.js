const DomainEvent = require('../../shared/DomainEvent');

/**
 * Domain event fired when a user is created
 */
class UserCreatedEvent extends DomainEvent {
  constructor(user, username, email) {
    super(user, 'UserCreated', { username, email });
  }
}

/**
 * Domain event fired when a user's profile is updated
 */
class UserProfileUpdatedEvent extends DomainEvent {
  constructor(user, changedFields) {
    super(user, 'UserProfileUpdated', { changedFields });
  }
}

/**
 * Domain event fired when a friendship is established
 */
class FriendshipEstablishedEvent extends DomainEvent {
  constructor(user, friendId) {
    super(user, 'FriendshipEstablished', { friendId });
  }
}

/**
 * Domain event fired when a user favorites a location
 */
class LocationFavoritedEvent extends DomainEvent {
  constructor(user, locationId) {
    super(user, 'LocationFavorited', { locationId });
  }
}

/**
 * Domain event fired when a user unfavorites a location
 */
class LocationUnfavoritedEvent extends DomainEvent {
  constructor(user, locationId) {
    super(user, 'LocationUnfavorited', { locationId });
  }
}

module.exports = {
  UserCreatedEvent,
  UserProfileUpdatedEvent,
  FriendshipEstablishedEvent,
  LocationFavoritedEvent,
  LocationUnfavoritedEvent,
};
