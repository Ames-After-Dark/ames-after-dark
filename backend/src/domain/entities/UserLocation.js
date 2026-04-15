const AggregateRoot = require('../../shared/AggregateRoot');
const {
  UserLocationCreatedEvent,
  UserLocationUpdatedEvent,
} = require('../events/UserLocationEvents');

class UserLocation extends AggregateRoot {
  constructor(id, userId, latitude, longitude, props = {}) {
    super(id);
    this.userId = userId;
    this.latitude = latitude;
    this.longitude = longitude;
    this.accuracy = props.accuracy;
    this.speed = props.speed;
    this.heading = props.heading;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  static create(id, userId, latitude, longitude, props = {}) {
    const userLocation = new UserLocation(id, userId, latitude, longitude, props);
    userLocation.publishEvent(new UserLocationCreatedEvent(id, userId));
    return userLocation;
  }

  updateLocation(latitude, longitude, props = {}) {
    this.latitude = latitude;
    this.longitude = longitude;
    this.accuracy = props.accuracy ?? this.accuracy;
    this.speed = props.speed ?? this.speed;
    this.heading = props.heading ?? this.heading;
    this.updatedAt = new Date();
    this.publishEvent(new UserLocationUpdatedEvent(this.id, this.userId));
  }

  toObject() {
    return {
      id: this.id,
      userId: this.userId,
      latitude: this.latitude,
      longitude: this.longitude,
      accuracy: this.accuracy,
      speed: this.speed,
      heading: this.heading,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = UserLocation;
