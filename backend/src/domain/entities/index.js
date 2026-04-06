/**
 * Domain Entity base class
 * Entities have identity and are mutable
 */
class Entity {
  constructor(id) {
    this.id = id;
  }

  equals(other) {
    return other instanceof this.constructor && this.id.equals(other.id);
  }

  sameIdentityAs(other) {
    return this.equals(other);
  }
}

/**
 * Banner Entity - Aggregate Root
 * A banner highlights deals or events on the home screen
 */
class Banner extends Entity {
  constructor(id, name, imageUrl, createdAt = new Date()) {
    super(id);
    this.validate(name, imageUrl);
    
    this.name = name;
    this.imageUrl = imageUrl;
    this.createdAt = new Date(createdAt);
    this.isActive = true;
  }

  validate(name, imageUrl) {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new Error('Banner name is required and must be a non-empty string');
    }
    if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
      throw new Error('Banner imageUrl is required and must be a non-empty string');
    }
  }

  activate() {
    this.isActive = true;
  }

  deactivate() {
    this.isActive = false;
  }

  updateDetails(name, imageUrl) {
    this.validate(name, imageUrl);
    this.name = name;
    this.imageUrl = imageUrl;
  }

  toPersistence() {
    return {
      id: this.id.value,
      name: this.name,
      image_url: this.imageUrl,
      created_at: this.createdAt,
      is_active: this.isActive,
    };
  }

  static fromPersistence(data) {
    const { EntityIds } = require('./index');
    const banner = new Banner(
      EntityIds.bannerId(data.id),
      data.name,
      data.image_url,
      data.created_at
    );
    banner.isActive = data.is_active !== false;
    return banner;
  }
}

/**
 * Deal Entity
 * Represents a promotional deal at a specific location
 */
class Deal extends Entity {
  constructor(id, title, description, locationId, createdAt = new Date()) {
    super(id);
    this.validate(title, description);
    
    this.title = title;
    this.description = description;
    this.locationId = locationId;
    this.createdAt = new Date(createdAt);
    this.isActive = true;
    this.occurrences = [];
  }

  validate(title, description) {
    if (!title || typeof title !== 'string' || title.trim() === '') {
      throw new Error('Deal title is required and must be a non-empty string');
    }
    if (!description || typeof description !== 'string' || description.trim() === '') {
      throw new Error('Deal description is required and must be a non-empty string');
    }
  }

  addOccurrence(startTime, endTime) {
    const { DateRange } = require('./index');
    const dateRange = new DateRange(startTime, endTime);
    this.occurrences.push(dateRange);
  }

  hasActiveOccurrence(now = new Date()) {
    return this.isActive && this.occurrences.some(o => o.contains(now));
  }

  activate() {
    this.isActive = true;
  }

  deactivate() {
    this.isActive = false;
  }

  replaceOccurrences(occurrences) {
    const { DateRange } = require('./index');
    this.occurrences = occurrences.map(o => new DateRange(o.startDate, o.endDate));
  }

  toPersistence() {
    return {
      id: this.id.value,
      title: this.title,
      description: this.description,
      location_id: this.locationId?.value,
      created_at: this.createdAt,
      is_active: this.isActive,
    };
  }

  static fromPersistence(data) {
    const { EntityIds } = require('./index');
    const deal = new Deal(
      EntityIds.dealId(data.id),
      data.title,
      data.description,
      data.location_id ? EntityIds.locationId(data.location_id) : null,
      data.created_at
    );
    deal.isActive = data.is_active !== false;
    return deal;
  }
}

/**
 * Event Entity
 * Represents an event at a specific location
 */
class Event extends Entity {
  constructor(id, title, description, locationId, createdAt = new Date()) {
    super(id);
    this.validate(title, description);
    
    this.title = title;
    this.description = description;
    this.locationId = locationId;
    this.createdAt = new Date(createdAt);
    this.isActive = true;
    this.occurrences = [];
  }

  validate(title, description) {
    if (!title || typeof title !== 'string' || title.trim() === '') {
      throw new Error('Event title is required and must be a non-empty string');
    }
    if (!description || typeof description !== 'string' || description.trim() === '') {
      throw new Error('Event description is required and must be a non-empty string');
    }
  }

  addOccurrence(startTime, endTime) {
    const { DateRange } = require('./index');
    const dateRange = new DateRange(startTime, endTime);
    this.occurrences.push(dateRange);
  }

  hasActiveOccurrence(now = new Date()) {
    return this.isActive && this.occurrences.some(o => o.contains(now));
  }

  activate() {
    this.isActive = true;
  }

  deactivate() {
    this.isActive = false;
  }

  replaceOccurrences(occurrences) {
    const { DateRange } = require('./index');
    this.occurrences = occurrences.map(o => new DateRange(o.startDate, o.endDate));
  }

  toPersistence() {
    return {
      id: this.id.value,
      title: this.title,
      description: this.description,
      location_id: this.locationId?.value,
      created_at: this.createdAt,
      is_active: this.isActive,
    };
  }

  static fromPersistence(data) {
    const { EntityIds } = require('./index');
    const event = new Event(
      EntityIds.eventId(data.id),
      data.title,
      data.description,
      data.location_id ? EntityIds.locationId(data.location_id) : null,
      data.created_at
    );
    event.isActive = data.is_active !== false;
    return event;
  }
}

module.exports = {
  Entity,
  Banner,
  Deal,
  Event,
};
