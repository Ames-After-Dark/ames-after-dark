const DomainEvent = require('../../shared/DomainEvent');

class EventCreatedEvent extends DomainEvent {
  constructor(eventId, title, locationId) {
    super('EventCreatedEvent');
    this.eventId = eventId;
    this.title = title;
    this.locationId = locationId;
    this.occurredAt = new Date();
  }
}

class EventUpdatedEvent extends DomainEvent {
  constructor(eventId, title) {
    super('EventUpdatedEvent');
    this.eventId = eventId;
    this.title = title;
    this.occurredAt = new Date();
  }
}

class EventDeletedEvent extends DomainEvent {
  constructor(eventId) {
    super('EventDeletedEvent');
    this.eventId = eventId;
    this.occurredAt = new Date();
  }
}

class EventAttendeeAddedEvent extends DomainEvent {
  constructor(eventId, attendeeCount) {
    super('EventAttendeeAddedEvent');
    this.eventId = eventId;
    this.attendeeCount = attendeeCount;
    this.occurredAt = new Date();
  }
}

module.exports = {
  EventCreatedEvent,
  EventUpdatedEvent,
  EventDeletedEvent,
  EventAttendeeAddedEvent,
};
