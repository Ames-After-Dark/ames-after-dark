const AggregateRoot = require('../../shared/AggregateRoot');
const {
  BannerCreatedEvent,
  BannerUpdatedEvent,
  BannerDeletedEvent,
} = require('../events/BannerEvents');

class Banner extends AggregateRoot {
  constructor(id, title, content, imageUrl, props = {}) {
    super(id);
    this.title = title;
    this.content = content;
    this.imageUrl = imageUrl;
    this.isActive = props.isActive ?? true;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.priority = props.priority ?? 0;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  static create(id, title, content, imageUrl, props = {}) {
    const banner = new Banner(id, title, content, imageUrl, props);
    banner.publishEvent(new BannerCreatedEvent(id, title));
    return banner;
  }

  updateDetails(title, content, imageUrl) {
    this.title = title ?? this.title;
    this.content = content ?? this.content;
    this.imageUrl = imageUrl ?? this.imageUrl;
    this.updatedAt = new Date();
    this.publishEvent(new BannerUpdatedEvent(this.id, this.title));
  }

  toObject() {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      imageUrl: this.imageUrl,
      isActive: this.isActive,
      startDate: this.startDate,
      endDate: this.endDate,
      priority: this.priority,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Banner;
