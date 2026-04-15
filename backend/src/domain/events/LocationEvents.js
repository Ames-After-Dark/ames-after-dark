const DomainEvent = require('../../shared/DomainEvent');

/**
 * Domain event fired when a location is created
 */
class LocationCreatedEvent extends DomainEvent {
  constructor(location, name, coordinates, address) {
    super(location, 'LocationCreated', {
      name,
      coordinates,
      address,
    });
  }
}

/**
 * Domain event fired when a location is updated
 */
class LocationUpdatedEvent extends DomainEvent {
  constructor(location, changedFields) {
    super(location, 'LocationUpdated', { changedFields });
  }
}

/**
 * Domain event fired when a location is deleted
 */
class LocationDeletedEvent extends DomainEvent {
  constructor(location) {
    super(location, 'LocationDeleted', {});
  }
}

/**
 * Domain event fired when location goes online
 */
class LocationOpenedEvent extends DomainEvent {
  constructor(location) {
    super(location, 'LocationOpened', {});
  }
}

/**
 * Domain event fired when location goes offline
 */
class LocationClosedEvent extends DomainEvent {
  constructor(location) {
    super(location, 'LocationClosed', {});
  }
}

module.exports = {
  LocationCreatedEvent,
  LocationUpdatedEvent,
  LocationDeletedEvent,
  LocationOpenedEvent,
  LocationClosedEvent,
};
