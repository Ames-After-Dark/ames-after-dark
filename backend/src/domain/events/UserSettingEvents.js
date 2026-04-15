const DomainEvent = require('../../shared/DomainEvent');

class UserSettingUpdatedEvent extends DomainEvent {
  constructor(userSettingId, userId) {
    super('UserSettingUpdatedEvent');
    this.userSettingId = userSettingId;
    this.userId = userId;
    this.occurredAt = new Date();
  }
}

module.exports = {
  UserSettingUpdatedEvent,
};
