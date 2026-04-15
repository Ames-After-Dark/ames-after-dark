class DomainEventPublisher {
  async publish(event) {
    throw new Error('publish not implemented');
  }

  subscribe(eventType, handler) {
    throw new Error('subscribe not implemented');
  }

  unsubscribe(eventType, handler) {
    throw new Error('unsubscribe not implemented');
  }
}

module.exports = DomainEventPublisher;
