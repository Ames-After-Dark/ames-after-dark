/**
 * Domain-specific error classes following DDD principles
 */

class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

class InvalidIdError extends DomainError {
  constructor(id, entityName) {
    super(`Invalid ${entityName} ID: ${id}`);
  }
}

class InvalidBannerError extends DomainError {
  constructor(message) {
    super(`Invalid Banner: ${message}`);
  }
}

class InvalidDealError extends DomainError {
  constructor(message) {
    super(`Invalid Deal: ${message}`);
  }
}

class InvalidEventError extends DomainError {
  constructor(message) {
    super(`Invalid Event: ${message}`);
  }
}

class InvalidLocationError extends DomainError {
  constructor(message) {
    super(`Invalid Location: ${message}`);
  }
}

class InvalidUserError extends DomainError {
  constructor(message) {
    super(`Invalid User: ${message}`);
  }
}

class AggregateNotFoundError extends DomainError {
  constructor(aggregateType, id) {
    super(`${aggregateType} with ID ${id} not found`);
  }
}

class BusinessRuleViolationError extends DomainError {
  constructor(rule) {
    super(`Business rule violation: ${rule}`);
  }
}

module.exports = {
  DomainError,
  InvalidIdError,
  InvalidBannerError,
  InvalidDealError,
  InvalidEventError,
  InvalidLocationError,
  InvalidUserError,
  AggregateNotFoundError,
  BusinessRuleViolationError,
};
