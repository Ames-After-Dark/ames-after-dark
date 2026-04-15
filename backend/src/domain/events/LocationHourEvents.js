const DomainEvent = require('../../shared/DomainEvent');

class LocationHourCreatedEvent extends DomainEvent {
  constructor(locationHourId, locationId, dayOfWeek) {
    super('LocationHourCreatedEvent');
    this.locationHourId = locationHourId;
    this.locationId = locationId;
    this.dayOfWeek = dayOfWeek;
    this.occurredAt = new Date();
  }
}

class LocationHourUpdatedEvent extends DomainEvent {
  constructor(locationHourId, locationId) {
    super('LocationHourUpdatedEvent');
    this.locationHourId = locationHourId;
    this.locationId = locationId;
    this.occurredAt = new Date();
  }
}

module.exports = {
  LocationHourCreatedEvent,
  LocationHourUpdatedEvent,
};
