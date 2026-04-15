class UserSettingResponseDTO {
  constructor(id, userId, notificationsEnabled, emailNotifications, pushNotifications, theme, privacy, locationSharing, preferredDistance, updatedAt) {
    this.id = id;
    this.userId = userId;
    this.notificationsEnabled = notificationsEnabled;
    this.emailNotifications = emailNotifications;
    this.pushNotifications = pushNotifications;
    this.theme = theme;
    this.privacy = privacy;
    this.locationSharing = locationSharing;
    this.preferredDistance = preferredDistance;
    this.updatedAt = updatedAt;
  }

  static fromDomain(userSettingEntity) {
    return new UserSettingResponseDTO(
      userSettingEntity.id,
      userSettingEntity.userId,
      userSettingEntity.notificationsEnabled,
      userSettingEntity.emailNotifications,
      userSettingEntity.pushNotifications,
      userSettingEntity.theme,
      userSettingEntity.privacy,
      userSettingEntity.locationSharing,
      userSettingEntity.preferredDistance,
      userSettingEntity.updatedAt
    );
  }
}

class UpdateUserSettingDTO {
  constructor(notificationsEnabled, emailNotifications, pushNotifications, theme, privacy, locationSharing, preferredDistance) {
    this.notificationsEnabled = notificationsEnabled;
    this.emailNotifications = emailNotifications;
    this.pushNotifications = pushNotifications;
    this.theme = theme;
    this.privacy = privacy;
    this.locationSharing = locationSharing;
    this.preferredDistance = preferredDistance;
  }
}

module.exports = {
  UserSettingResponseDTO,
  UpdateUserSettingDTO
};
