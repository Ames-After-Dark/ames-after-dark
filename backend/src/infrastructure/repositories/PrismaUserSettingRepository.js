const IUserSettingRepository = require('../../domain/repositories/IUserSettingRepository');
const UserSetting = require('../../domain/entities/UserSetting');
const prisma = require('../../db');

class PrismaUserSettingRepository extends IUserSettingRepository {
  async findById(id) {
    const raw = await prisma.user_settings.findUnique({ where: { id } });
    return raw ? this.toDomain(raw) : null;
  }

  async findByUserId(userId) {
    const raw = await prisma.user_settings.findUnique({ where: { user_id: userId } });
    return raw ? this.toDomain(raw) : null;
  }

  async save(userSetting) {
    const exists = await prisma.user_settings.findUnique({ where: { id: userSetting.id } });
    const data = this.toPersistence(userSetting);

    if (exists) {
      return this.toDomain(
        await prisma.user_settings.update({ where: { id: userSetting.id }, data })
      );
    } else {
      return this.toDomain(await prisma.user_settings.create({ data }));
    }
  }

  async delete(id) {
    await prisma.user_settings.delete({ where: { id } });
  }

  toDomain(raw) {
    return new UserSetting(raw.id, raw.user_id, {
      notificationsEnabled: raw.notifications_enabled,
      privacyLevel: raw.privacy_level,
      shareLocation: raw.share_location,
      preferredDistance: raw.preferred_distance,
      theme: raw.theme,
      language: raw.language,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }

  toPersistence(domain) {
    const obj = domain.toObject();
    return {
      user_id: obj.userId,
      notifications_enabled: obj.notificationsEnabled,
      privacy_level: obj.privacyLevel,
      share_location: obj.shareLocation,
      preferred_distance: obj.preferredDistance,
      theme: obj.theme,
      language: obj.language,
      updated_at: new Date(),
    };
  }
}

module.exports = PrismaUserSettingRepository;
