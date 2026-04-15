const AggregateRoot = require('../../shared/AggregateRoot');
const {
  UserSettingUpdatedEvent,
} = require('../events/UserSettingEvents');

class UserSetting extends AggregateRoot {
  constructor(id, userId, props = {}) {
    super(id);
    this.userId = userId;
    this.notificationsEnabled = props.notificationsEnabled ?? true;
    this.privacyLevel = props.privacyLevel ?? 'public'; // public, friends, private
    this.shareLocation = props.shareLocation ?? false;
    this.preferredDistance = props.preferredDistance ?? 5; // km
    this.theme = props.theme ?? 'light';
    this.language = props.language ?? 'en';
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  static create(id, userId, props = {}) {
    const userSetting = new UserSetting(id, userId, props);
    return userSetting;
  }

  updateSettings(updates) {
    if (updates.notificationsEnabled !== undefined) {
      this.notificationsEnabled = updates.notificationsEnabled;
    }
    if (updates.privacyLevel !== undefined) {
      this.privacyLevel = updates.privacyLevel;
    }
    if (updates.shareLocation !== undefined) {
      this.shareLocation = updates.shareLocation;
    }
    if (updates.preferredDistance !== undefined) {
      this.preferredDistance = updates.preferredDistance;
    }
    if (updates.theme !== undefined) {
      this.theme = updates.theme;
    }
    if (updates.language !== undefined) {
      this.language = updates.language;
    }
    this.updatedAt = new Date();
    this.publishEvent(new UserSettingUpdatedEvent(this.id, this.userId));
  }

  toObject() {\n    return {
      id: this.id,
      userId: this.userId,
      notificationsEnabled: this.notificationsEnabled,
      privacyLevel: this.privacyLevel,
      shareLocation: this.shareLocation,
      preferredDistance: this.preferredDistance,
      theme: this.theme,
      language: this.language,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = UserSetting;
