const AggregateRoot = require('../../shared/AggregateRoot');
const {
  FriendshipCreatedEvent,
  FriendshipAcceptedEvent,
  FriendshipRejectedEvent,
  FriendshipRemovedEvent,
} = require('../events/FriendshipEvents');

class Friendship extends AggregateRoot {
  constructor(id, userId1, userId2, props = {}) {
    super(id);
    this.userId1 = userId1;
    this.userId2 = userId2;
    this.status = props.status ?? 'pending'; // pending, accepted, rejected
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  static create(id, userId1, userId2) {
    const friendship = new Friendship(id, userId1, userId2);
    friendship.publishEvent(new FriendshipCreatedEvent(id, userId1, userId2));
    return friendship;
  }

  accept() {
    this.status = 'accepted';
    this.updatedAt = new Date();
    this.publishEvent(new FriendshipAcceptedEvent(this.id, this.userId1, this.userId2));
  }

  reject() {
    this.status = 'rejected';
    this.updatedAt = new Date();
    this.publishEvent(new FriendshipRejectedEvent(this.id, this.userId1, this.userId2));
  }

  remove() {
    this.status = 'removed';
    this.updatedAt = new Date();
    this.publishEvent(new FriendshipRemovedEvent(this.id, this.userId1, this.userId2));
  }

  toObject() {
    return {
      id: this.id,
      userId1: this.userId1,
      userId2: this.userId2,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Friendship;
