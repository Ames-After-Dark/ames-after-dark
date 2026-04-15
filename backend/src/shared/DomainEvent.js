/**
 * Base Domain Event class for publishing domain events
 */
class DomainEvent {
  constructor(aggregate, eventName, data = {}) {
    this.aggregateId = aggregate.id;
    this.aggregateName = aggregate.constructor.name;
    this.eventName = eventName;
    this.data = data;
    this.timestamp = new Date();
    this.version = 1;
  }

  /**
   * Get event metadata for logging/publishing
   */
  getMetadata() {
    return {
      aggregateId: this.aggregateId,
      aggregateName: this.aggregateName,
      eventName: this.eventName,
      timestamp: this.timestamp,
      version: this.version,
    };
  }
}

module.exports = DomainEvent;
