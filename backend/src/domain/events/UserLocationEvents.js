const DomainEvent = require('../../shared/DomainEvent');

class UserLocationCreatedEvent extends DomainEvent {
  constructor(userLocationId, userId) {
    super('UserLocationCreatedEvent');
    this.userLocationId = userLocationId;
    this.userId = userId;
    this.occurredAt = new Date();
  }
}

class UserLocationUpdatedEvent extends DomainEvent {
  constructor(userLocationId, userId) {
    super('UserLocationUpdatedEvent');
    this.userLocationId = userLocationId;
    this.userId = userId;
    this.occurredAt = new Date();
  }
}

module.exports = {
  UserLocationCreatedEvent,
  UserLocationUpdatedEvent,
};
