const AggregateRoot = require('../../shared/AggregateRoot');
const {
  LocationHourCreatedEvent,
  LocationHourUpdatedEvent,
} = require('../events/LocationHourEvents');

class LocationHour extends AggregateRoot {
  constructor(id, locationId, dayOfWeek, openTime, closeTime, props = {}) {
    super(id);
    this.locationId = locationId;
    this.dayOfWeek = dayOfWeek; // 0-6 (Sun-Sat)
    this.openTime = openTime; // HH:mm format
    this.closeTime = closeTime;
    this.isOpen = props.isOpen ?? true;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  static create(id, locationId, dayOfWeek, openTime, closeTime, props = {}) {
    const locationHour = new LocationHour(id, locationId, dayOfWeek, openTime, closeTime, props);
    locationHour.publishEvent(new LocationHourCreatedEvent(id, locationId, dayOfWeek));
    return locationHour;
  }

  updateHours(openTime, closeTime) {
    this.openTime = openTime ?? this.openTime;
    this.closeTime = closeTime ?? this.closeTime;
    this.updatedAt = new Date();
    this.publishEvent(new LocationHourUpdatedEvent(this.id, this.locationId));
  }

  toObject() {
    return {
      id: this.id,
      locationId: this.locationId,
      dayOfWeek: this.dayOfWeek,
      openTime: this.openTime,
      closeTime: this.closeTime,
      isOpen: this.isOpen,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = LocationHour;
