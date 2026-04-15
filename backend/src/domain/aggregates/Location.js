const AggregateRoot = require('../../shared/AggregateRoot');
const Coordinates = require('../value-objects/Coordinates');
const {
  LocationCreatedEvent,
  LocationOpenedEvent,
  LocationClosedEvent,
  LocationUpdatedEvent,
} = require('../events/LocationEvents');

/**
 * Location Aggregate Root
 * Represents a bar/venue in the Ames After Dark system.
 * Encapsulates all business logic for location management.
 */
class Location extends AggregateRoot {
  constructor(
    id,
    name,
    coordinates,
    props = {}
  ) {
    super(id, props);
    this.name = name;
    this.coordinates = coordinates;
    this.address = props.address || null;
    this.description = props.description || null;
    this.timezone = props.timezone || 'UTC';
    this.isOpen = props.isOpen !== undefined ? props.isOpen : false;
    this.views = props.views || 0;
    this.tags = props.tags || [];
    this.type = props.type || null;
    this.zone = props.zone || null;
    this.nickname = props.nickname || null;
    this.phoneNumber = props.phoneNumber || null;
    this.website = props.website || null;
    this.imageUrl = props.imageUrl || null;
  }

  /**
   * Create a new location (factory method)
   */
  static create(id, name, coordinates, props = {}) {
    if (!name || name.trim().length === 0) {
      throw new Error('Location name is required');
    }
    if (!(coordinates instanceof Coordinates)) {
      throw new Error('Coordinates must be a Coordinates instance');
    }

    const location = new Location(id, name, coordinates, props);
    location.publishEvent(new LocationCreatedEvent(location, name, coordinates, props.address));
    return location;
  }

  /**
   * Update location details
   */
  updateDetails(name, address, description, imageUrl) {
    const changedFields = {};

    if (name && name !== this.name) {
      this.name = name;
      changedFields.name = name;
    }
    if (address && address !== this.address) {
      this.address = address;
      changedFields.address = address;
    }
    if (description && description !== this.description) {
      this.description = description;
      changedFields.description = description;
    }
    if (imageUrl && imageUrl !== this.imageUrl) {
      this.imageUrl = imageUrl;
      changedFields.imageUrl = imageUrl;
    }

    if (Object.keys(changedFields).length > 0) {
      this.publishEvent(new LocationUpdatedEvent(this, changedFields));
    }
  }

  /**
   * Mark location as open
   */
  markAsOpen() {
    if (!this.isOpen) {
      this.isOpen = true;
      this.publishEvent(new LocationOpenedEvent(this));
    }
  }

  /**
   * Mark location as closed
   */
  markAsClosed() {
    if (this.isOpen) {
      this.isOpen = false;
      this.publishEvent(new LocationClosedEvent(this));
    }
  }

  /**
   * Increment view count
   */
  recordView() {
    this.views += 1;
  }

  /**
   * Get location coordinates
   */
  getCoordinates() {
    return this.coordinates;
  }

  /**
   * Check if location is near coordinates (within radius in km)
   */
  isNear(otherCoordinates, radiusKm = 5) {
    const distance = this.coordinates.distanceTo(otherCoordinates);
    return distance <= radiusKm;
  }

  /**
   * Convert to domain representation
   */
  toObject() {
    return {
      id: this.id,
      name: this.name,
      address: this.address,
      description: this.description,
      coordinates: this.coordinates.toObject(),
      timezone: this.timezone,
      isOpen: this.isOpen,
      views: this.views,
      tags: this.tags,
      type: this.type,
      zone: this.zone,
      nickname: this.nickname,
      phoneNumber: this.phoneNumber,
      website: this.website,
      imageUrl: this.imageUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Location;
