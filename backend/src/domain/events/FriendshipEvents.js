const DomainEvent = require('../../shared/DomainEvent');

class FriendshipCreatedEvent extends DomainEvent {
  constructor(friendshipId, userId1, userId2) {
    super('FriendshipCreatedEvent');
    this.friendshipId = friendshipId;
    this.userId1 = userId1;
    this.userId2 = userId2;
    this.occurredAt = new Date();
  }
}

class FriendshipAcceptedEvent extends DomainEvent {
  constructor(friendshipId, userId1, userId2) {
    super('FriendshipAcceptedEvent');
    this.friendshipId = friendshipId;
    this.userId1 = userId1;
    this.userId2 = userId2;
    this.occurredAt = new Date();
  }
}

class FriendshipRejectedEvent extends DomainEvent {
  constructor(friendshipId, userId1, userId2) {
    super('FriendshipRejectedEvent');
    this.friendshipId = friendshipId;
    this.userId1 = userId1;
    this.userId2 = userId2;
    this.occurredAt = new Date();
  }
}

class FriendshipRemovedEvent extends DomainEvent {
  constructor(friendshipId, userId1, userId2) {
    super('FriendshipRemovedEvent');
    this.friendshipId = friendshipId;
    this.userId1 = userId1;
    this.userId2 = userId2;
    this.occurredAt = new Date();
  }
}

module.exports = {
  FriendshipCreatedEvent,
  FriendshipAcceptedEvent,
  FriendshipRejectedEvent,
  FriendshipRemovedEvent,
};
