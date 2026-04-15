const BaseValueObject = require('../../shared/BaseValueObject');

/**
 * Geographic coordinates value object
 * Represents latitude and longitude for a location
 */
class Coordinates extends BaseValueObject {
  constructor(latitude, longitude) {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new Error('Coordinates must be valid numbers');
    }
    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }
    super({
      latitude: Number(latitude),
      longitude: Number(longitude),
    });
  }

  static create(latitude, longitude) {
    return new Coordinates(latitude, longitude);
  }

  get latitude() {
    return this.props.latitude;
  }

  get longitude() {
    return this.props.longitude;
  }

  /**
   * Calculate distance between two coordinate points (in kilometers)
   * Using Haversine formula
   */
  distanceTo(other) {
    if (!(other instanceof Coordinates)) {
      throw new Error('Must compare with another Coordinates instance');
    }

    const R = 6371; // Earth's radius in km
    const dLat = (other.latitude - this.latitude) * (Math.PI / 180);
    const dLon = (other.longitude - this.longitude) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((this.latitude * Math.PI) / 180) *
        Math.cos((other.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toObject() {
    return {
      latitude: this.latitude,
      longitude: this.longitude,
    };
  }
}

module.exports = Coordinates;
