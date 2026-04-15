const AggregateRoot = require('../../shared/AggregateRoot');
const {
  EventCreatedEvent,
  EventUpdatedEvent,
  EventDeletedEvent,
  EventAttendeeAddedEvent,
} = require('../events/EventEvents');

class Event extends AggregateRoot {
  constructor(
    id,
    title,
    description,
    startTime,
    endTime,
    locationId,
    props = {}
  ) {
    super(id);
    this.title = title;
    this.description = description;
    this.startTime = startTime;
    this.endTime = endTime;
    this.locationId = locationId;
    this.attendeeCount = props.attendeeCount ?? 0;
    this.imageUrl = props.imageUrl;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  static create(
    id,
    title,
    description,
    startTime,
    endTime,
    locationId,
    props = {}
  ) {
    const event = new Event(
      id,
      title,
      description,
      startTime,
      endTime,
      locationId,
      props
    );
    event.publishEvent(new EventCreatedEvent(id, title, locationId));
    return event;
  }

  recordAttendee() {
    this.attendeeCount += 1;
    this.publishEvent(new EventAttendeeAddedEvent(this.id, this.attendeeCount));
  }

  updateDetails(title, description, startTime, endTime) {
    this.title = title ?? this.title;
    this.description = description ?? this.description;
    this.startTime = startTime ?? this.startTime;
    this.endTime = endTime ?? this.endTime;
    this.updatedAt = new Date();
    this.publishEvent(new EventUpdatedEvent(this.id, this.title));
  }

  toObject() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      startTime: this.startTime,
      endTime: this.endTime,
      locationId: this.locationId,
      attendeeCount: this.attendeeCount,
      imageUrl: this.imageUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Event;
