const DomainEvent = require('../../shared/DomainEvent');

class DealCreatedEvent extends DomainEvent {
  constructor(dealId, title, locationId, discount) {
    super('DealCreatedEvent');
    this.dealId = dealId;
    this.title = title;
    this.locationId = locationId;
    this.discount = discount;
    this.occurredAt = new Date();
  }
}

class DealUpdatedEvent extends DomainEvent {
  constructor(dealId, title) {
    super('DealUpdatedEvent');
    this.dealId = dealId;
    this.title = title;
    this.occurredAt = new Date();
  }
}

class DealDeletedEvent extends DomainEvent {
  constructor(dealId) {
    super('DealDeletedEvent');
    this.dealId = dealId;
    this.occurredAt = new Date();
  }
}

class DealActivatedEvent extends DomainEvent {
  constructor(dealId) {
    super('DealActivatedEvent');
    this.dealId = dealId;
    this.occurredAt = new Date();
  }
}

class DealDeactivatedEvent extends DomainEvent {
  constructor(dealId) {
    super('DealDeactivatedEvent');
    this.dealId = dealId;
    this.occurredAt = new Date();
  }
}

module.exports = {
  DealCreatedEvent,
  DealUpdatedEvent,
  DealDeletedEvent,
  DealActivatedEvent,
  DealDeactivatedEvent,
};
