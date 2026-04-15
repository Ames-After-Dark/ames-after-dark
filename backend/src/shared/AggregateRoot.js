const BaseEntity = require('./BaseEntity');

/**
 * Aggregate Root base class for DDD.
 * An aggregate root is the entity that serves as the entry point to the aggregate.
 * Ensures transactional consistency within aggregate boundaries.
 */
class AggregateRoot extends BaseEntity {
  constructor(id, props = {}, createdAt = new Date(), updatedAt = new Date()) {
    super(id, props, createdAt, updatedAt);
    this.uncommittedEvents = [];
  }

  /**
   * Publish a domain event
   */
  publishEvent(domainEvent) {
    this.uncommittedEvents.push(domainEvent);
  }

  /**
   * Get all uncommitted events and clear them
   */
  getUncommittedEvents() {
    const events = [...this.uncommittedEvents];
    this.uncommittedEvents = [];
    return events;
  }

  /**
   * Mark events as committed
   */
  clearEvents() {
    this.uncommittedEvents = [];
  }

  /**
   * Check if aggregate has uncommitted events
   */
  hasUncommittedEvents() {
    return this.uncommittedEvents.length > 0;
  }
}

module.exports = AggregateRoot;
