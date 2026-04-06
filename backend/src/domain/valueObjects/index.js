/**
 * Base Value Object class
 * Value objects are immutable objects that have no identity
 */
class ValueObject {
  equals(other) {
    return other instanceof this.constructor && this.primitive() === other.primitive();
  }

  primitive() {
    throw new Error('Must be implemented');
  }
}

/**
 * Numeric ID Value Object - used for all entity IDs
 */
class NumericId extends ValueObject {
  constructor(value, entityType) {
    super();
    if (!Number.isInteger(value) || value < 1) {
      throw new Error(`Invalid ${entityType} ID: ${value}. Must be positive integer.`);
    }
    this.value = value;
    this.entityType = entityType;
  }

  primitive() {
    return this.value;
  }

  toString() {
    return `${this.entityType}:${this.value}`;
  }

  static parse(value, entityType) {
    return new NumericId(Number(value), entityType);
  }

  toJSON() {
    return this.value;
  }
}

/**
 * String ID Value Object - for UUIDs or string identifiers
 */
class StringId extends ValueObject {
  constructor(value, entityType) {
    super();
    if (!value || typeof value !== 'string' || value.trim() === '') {
      throw new Error(`Invalid ${entityType} ID: must be non-empty string`);
    }
    this.value = value.trim();
    this.entityType = entityType;
  }

  primitive() {
    return this.value;
  }

  toString() {
    return `${this.entityType}:${this.value}`;
  }

  toJSON() {
    return this.value;
  }
}

/**
 * Factory functions for common IDs
 */
class EntityIds {
  static bannerId(value) {
    return new NumericId(Number(value), 'BannerId');
  }

  static dealId(value) {
    return new NumericId(Number(value), 'DealId');
  }

  static eventId(value) {
    return new NumericId(Number(value), 'EventId');
  }

  static locationId(value) {
    return new NumericId(Number(value), 'LocationId');
  }

  static userId(value) {
    return new NumericId(Number(value), 'UserId');
  }

  static auth0Id(value) {
    return new StringId(value, 'Auth0Id');
  }

  static menuItemId(value) {
    return new NumericId(Number(value), 'MenuItemId');
  }

  static friendshipId(value) {
    return new NumericId(Number(value), 'FriendshipId');
  }
}

/**
 * Email Value Object - ensures email validity
 */
class Email extends ValueObject {
  constructor(value) {
    super();
    const trimmed = (value || '').trim().toLowerCase();
    if (!this.isValidEmail(trimmed)) {
      throw new Error(`Invalid email: ${value}`);
    }
    this.value = trimmed;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  primitive() {
    return this.value;
  }

  toString() {
    return this.value;
  }

  toJSON() {
    return this.value;
  }
}

/**
 * Username Value Object
 */
class Username extends ValueObject {
  constructor(value) {
    super();
    if (!value || typeof value !== 'string') {
      throw new Error('Username must be a non-empty string');
    }
    if (value.length < 3 || value.length > 30) {
      throw new Error('Username must be between 3 and 30 characters');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      throw new Error('Username can only contain letters, numbers, underscores, and hyphens');
    }
    this.value = value;
  }

  primitive() {
    return this.value;
  }

  toString() {
    return this.value;
  }

  toJSON() {
    return this.value;
  }
}

/**
 * DateRange Value Object - ensures start <= end
 */
class DateRange extends ValueObject {
  constructor(startDate, endDate) {
    super();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime())) {
      throw new Error('Invalid start date');
    }
    if (isNaN(end.getTime())) {
      throw new Error('Invalid end date');
    }
    if (start > end) {
      throw new Error('Start date must be before or equal to end date');
    }

    this.startDate = start;
    this.endDate = end;
  }

  contains(date) {
    const d = new Date(date);
    return d >= this.startDate && d <= this.endDate;
  }

  overlaps(other) {
    return this.startDate <= other.endDate && this.endDate >= other.startDate;
  }

  primitive() {
    return {
      startDate: this.startDate.toISOString(),
      endDate: this.endDate.toISOString(),
    };
  }

  toJSON() {
    return this.primitive();
  }

  equals(other) {
    return other instanceof DateRange &&
      this.startDate.getTime() === other.startDate.getTime() &&
      this.endDate.getTime() === other.endDate.getTime();
  }
}

module.exports = {
  ValueObject,
  NumericId,
  StringId,
  EntityIds,
  Email,
  Username,
  DateRange,
};
