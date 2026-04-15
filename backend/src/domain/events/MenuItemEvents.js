const DomainEvent = require('../../shared/DomainEvent');

class MenuItemCreatedEvent extends DomainEvent {
  constructor(menuItemId, locationId, name) {
    super('MenuItemCreatedEvent');
    this.menuItemId = menuItemId;
    this.locationId = locationId;
    this.name = name;
    this.occurredAt = new Date();
  }
}

class MenuItemUpdatedEvent extends DomainEvent {
  constructor(menuItemId, name) {
    super('MenuItemUpdatedEvent');
    this.menuItemId = menuItemId;
    this.name = name;
    this.occurredAt = new Date();
  }
}

module.exports = {
  MenuItemCreatedEvent,
  MenuItemUpdatedEvent,
};
