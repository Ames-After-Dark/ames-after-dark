const DomainEvent = require('../../shared/DomainEvent');

class BannerCreatedEvent extends DomainEvent {
  constructor(bannerId, title) {
    super('BannerCreatedEvent');
    this.bannerId = bannerId;
    this.title = title;
    this.occurredAt = new Date();
  }
}

class BannerUpdatedEvent extends DomainEvent {
  constructor(bannerId, title) {
    super('BannerUpdatedEvent');
    this.bannerId = bannerId;
    this.title = title;
    this.occurredAt = new Date();
  }
}

class BannerDeletedEvent extends DomainEvent {
  constructor(bannerId) {
    super('BannerDeletedEvent');
    this.bannerId = bannerId;
    this.occurredAt = new Date();
  }
}

module.exports = {
  BannerCreatedEvent,
  BannerUpdatedEvent,
  BannerDeletedEvent,
};
