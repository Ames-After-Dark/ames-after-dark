const UserSetting = require('../../domain/entities/UserSetting');
const { UserSettingResponseDTO } = require('../dtos/UserSettingDTO');

class UserSettingApplicationService {
  constructor(userSettingRepository, userRepository, eventPublisher) {
    this.userSettingRepository = userSettingRepository;
    this.userRepository = userRepository;
    this.eventPublisher = eventPublisher;
  }

  async getUserSettings(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error(`User ${userId} not found`);
    
    let settings = await this.userSettingRepository.findByUser(userId);
    if (!settings) {
      settings = UserSetting.create(null, userId);
      await this.userSettingRepository.save(settings);
    }
    return UserSettingResponseDTO.fromDomain(settings);
  }

  async updateSettings(userId, updateSettingsDTO) {
    let settings = await this.userSettingRepository.findByUser(userId);
    if (!settings) {
      settings = UserSetting.create(null, userId);
    }

    const {
      notificationsEnabled,
      emailNotifications,
      pushNotifications,
      theme,
      privacy,
      locationSharing,
      preferredDistance,
    } = updateSettingsDTO;

    if (notificationsEnabled !== undefined) settings.setNotificationsEnabled(notificationsEnabled);
    if (emailNotifications !== undefined) settings.setEmailNotifications(emailNotifications);
    if (pushNotifications !== undefined) settings.setPushNotifications(pushNotifications);
    if (theme) settings.setTheme(theme);
    if (privacy) settings.setPrivacy(privacy);
    if (locationSharing !== undefined) settings.setLocationSharing(locationSharing);
    if (preferredDistance !== undefined) settings.setPreferredDistance(preferredDistance);

    const saved = await this.userSettingRepository.save(settings);
    saved.getUncommittedEvents().forEach(e => this.eventPublisher.publish(e));
    return UserSettingResponseDTO.fromDomain(saved);
  }

  async resetToDefaults(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error(`User ${userId} not found`);

    const settings = UserSetting.create(null, userId);
    const saved = await this.userSettingRepository.save(settings);
    saved.getUncommittedEvents().forEach(e => this.eventPublisher.publish(e));
    return UserSettingResponseDTO.fromDomain(saved);
  }
}

module.exports = UserSettingApplicationService;
