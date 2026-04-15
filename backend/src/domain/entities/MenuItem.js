const AggregateRoot = require('../../shared/AggregateRoot');
const {
  MenuItemCreatedEvent,
  MenuItemUpdatedEvent,
} = require('../events/MenuItemEvents');

class MenuItem extends AggregateRoot {
  constructor(id, locationId, name, description, price, props = {}) {
    super(id);
    this.locationId = locationId;
    this.name = name;
    this.description = description;
    this.price = price;
    this.category = props.category;
    this.imageUrl = props.imageUrl;
    this.isAvailable = props.isAvailable ?? true;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  static create(id, locationId, name, description, price, props = {}) {
    const menuItem = new MenuItem(id, locationId, name, description, price, props);
    menuItem.publishEvent(new MenuItemCreatedEvent(id, locationId, name));
    return menuItem;
  }

  updateDetails(name, description, price, category) {
    this.name = name ?? this.name;
    this.description = description ?? this.description;
    this.price = price ?? this.price;
    this.category = category ?? this.category;
    this.updatedAt = new Date();
    this.publishEvent(new MenuItemUpdatedEvent(this.id, this.name));
  }

  markAvailable() {
    this.isAvailable = true;
  }

  markUnavailable() {
    this.isAvailable = false;
  }

  toObject() {
    return {
      id: this.id,
      locationId: this.locationId,
      name: this.name,
      description: this.description,
      price: this.price,
      category: this.category,
      imageUrl: this.imageUrl,
      isAvailable: this.isAvailable,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = MenuItem;
