/**
 * Simple in-memory Event Publisher
 * In production, this should publish to a message broker (RabbitMQ, Kafka, etc.)
 */
class EventPublisher {
  constructor() {
    this.subscribers = {};
  }

  /**
   * Subscribe to domain events
   */
  subscribe(eventName, handler) {
    if (!this.subscribers[eventName]) {
      this.subscribers[eventName] = [];
    }
    this.subscribers[eventName].push(handler);
  }

  /**
   * Publish domain event to all subscribers
   */
  async publish(event) {
    const eventName = event.eventName;
    if (!this.subscribers[eventName]) {
      return; // No subscribers
    }

    const handlers = this.subscribers[eventName];
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (err) {
        console.error(
          `Error handling event ${eventName}:`,
          err.message
        );
      }
    }
  }
}

module.exports = EventPublisher;
