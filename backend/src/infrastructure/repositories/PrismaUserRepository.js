const IUserRepository = require('../../domain/repositories/IUserRepository');
const User = require('../../domain/aggregates/User');

/**
 * Prisma implementation of User Repository
 * Handles persistence of User aggregates
 */
class PrismaUserRepository extends IUserRepository {
  constructor(prismaClient) {
    super();
    this.prisma = prismaClient;
  }

  /**
   * Convert Prisma model to User aggregate
   */
  toDomain(raw) {
    if (!raw) return null;

    return new User(raw.id, raw.uid, {
      username: raw.username,
      email: raw.email,
      name: raw.name,
      bio: raw.bio,
      birthday: raw.birthday,
      phoneNumber: raw.phone_number,
      streak: raw.streak,
      lastStreakWeek: raw.last_streak_week,
      lastStreakYear: raw.last_streak_year,
      roleId: raw.role_id,
      profilePhotoId: raw.profile_photo_id,
      favoriteDrinkId: raw.favorite_drink_id,
      favoriteLocationId: raw.favorite_profile_location_id,
    });
  }

  /**
   * Convert User aggregate to Prisma save format
   */
  toPersistence(user) {
    return {
      uid: user.uid,
      username: user.username,
      email: user.email ? user.email.value : null,
      name: user.name,
      bio: user.bio,
      birthday: user.birthday,
      phone_number: user.phoneNumber,
      streak: user.streak,
      last_streak_week: user.lastStreakWeek,
      last_streak_year: user.lastStreakYear,
      role_id: user.roleId,
      profile_photo_id: user.profilePhotoId,
      favorite_drink_id: user.favoriteDrinkId,
      favorite_profile_location_id: user.favoriteLocationId,
    };
  }

  async findById(id) {
    const raw = await this.prisma.users.findUnique({
      where: { id: Number(id) },
    });
    return this.toDomain(raw);
  }

  async findByUid(uid) {
    const raw = await this.prisma.users.findUnique({
      where: { uid },
    });
    return this.toDomain(raw);
  }

  async findByEmail(email) {
    const raw = await this.prisma.users.findUnique({
      where: { email },
    });
    return this.toDomain(raw);
  }

  async findByUsername(username) {
    const raw = await this.prisma.users.findFirst({
      where: { username },
    });
    return this.toDomain(raw);
  }

  async findAll() {
    const raw = await this.prisma.users.findMany();
    return raw.map(r => this.toDomain(r));
  }

  async search(query) {
    const raw = await this.prisma.users.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
    });
    return raw.map(r => this.toDomain(r));
  }

  async save(user) {
    const data = this.toPersistence(user);
    const existing = await this.prisma.users.findUnique({
      where: { id: user.id },
    });

    let saved;
    if (existing) {
      saved = await this.prisma.users.update({
        where: { id: user.id },
        data: { ...data, updated_at: new Date() },
      });
    } else {
      saved = await this.prisma.users.create({
        data: { id: user.id, ...data },
      });
    }

    return this.toDomain(saved);
  }

  async delete(id) {
    await this.prisma.users.delete({
      where: { id: Number(id) },
    });
  }

  async addFavoriteLocation(userId, locationId) {
    return await this.prisma.user_favorite_locations.create({
      data: {
        user_id: Number(userId),
        location_id: Number(locationId),
      },
    });
  }

  async removeFavoriteLocation(userId, locationId) {
    return await this.prisma.user_favorite_locations.delete({
      where: {
        user_id_location_id: {
          user_id: Number(userId),
          location_id: Number(locationId),
        },
      },
    });
  }

  async getFavoriteLocations(userId) {
    const favorites = await this.prisma.user_favorite_locations.findMany({
      where: { user_id: Number(userId) },
      select: { location_id: true },
    });
    return favorites.map(f => f.location_id);
  }
}

module.exports = PrismaUserRepository;
