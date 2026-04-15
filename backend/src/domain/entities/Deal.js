const AggregateRoot = require('../../shared/AggregateRoot');
const {
  DealCreatedEvent,
  DealUpdatedEvent,
  DealDeletedEvent,
  DealActivatedEvent,
  DealDeactivatedEvent,
} = require('../events/DealEvents');

class Deal extends AggregateRoot {
  constructor(id, title, description, discount, locationId, props = {}) {
    super(id);
    this.title = title;
    this.description = description;
    this.discount = discount; // percentage
    this.locationId = locationId;
    this.isActive = props.isActive ?? true;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  static create(id, title, description, discount, locationId, props = {}) {
    const deal = new Deal(id, title, description, discount, locationId, props);
    deal.publishEvent(new DealCreatedEvent(id, title, locationId, discount));
    return deal;
  }

  updateDetails(title, description, discount, startDate, endDate) {
    this.title = title ?? this.title;
    this.description = description ?? this.description;
    this.discount = discount ?? this.discount;
    this.startDate = startDate ?? this.startDate;
    this.endDate = endDate ?? this.endDate;
    this.updatedAt = new Date();
    this.publishEvent(new DealUpdatedEvent(this.id, this.title));
  }

  markActive() {
    this.isActive = true;
    this.publishEvent(new DealActivatedEvent(this.id));
  }

  markInactive() {
    this.isActive = false;
    this.publishEvent(new DealDeactivatedEvent(this.id));
  }

  calculateDiscount(originalPrice) {
    return originalPrice * (1 - this.discount / 100);
  }

  toObject() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      discount: this.discount,
      locationId: this.locationId,
      isActive: this.isActive,
      startDate: this.startDate,
      endDate: this.endDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Deal;
