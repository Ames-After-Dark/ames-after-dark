const IUserLocationRepository = require('../../domain/repositories/IUserLocationRepository');
const UserLocation = require('../../domain/entities/UserLocation');
const prisma = require('../../db');

class PrismaUserLocationRepository extends IUserLocationRepository {
  async findById(id) {
    const raw = await prisma.user_locations.findUnique({ where: { id } });
    return raw ? this.toDomain(raw) : null;
  }

  async findByUserId(userId) {
    const raw = await prisma.user_locations.findMany({ where: { user_id: userId } });
    return raw.map(r => this.toDomain(r));
  }

  async findRecent(userId, limit = 10) {
    const raw = await prisma.user_locations.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
    return raw.map(r => this.toDomain(r));
  }

  async save(userLocation) {
    const exists = await prisma.user_locations.findUnique({ where: { id: userLocation.id } });
    const data = this.toPersistence(userLocation);

    if (exists) {
      return this.toDomain(
        await prisma.user_locations.update({ where: { id: userLocation.id }, data })
      );
    } else {
      return this.toDomain(await prisma.user_locations.create({ data }));
    }
  }

  async delete(id) {
    await prisma.user_locations.delete({ where: { id } });
  }

  toDomain(raw) {
    return new UserLocation(raw.id, raw.user_id, raw.latitude, raw.longitude, {
      accuracy: raw.accuracy,
      speed: raw.speed,
      heading: raw.heading,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }

  toPersistence(domain) {
    const obj = domain.toObject();
    return {
      user_id: obj.userId,
      latitude: obj.latitude,
      longitude: obj.longitude,
      accuracy: obj.accuracy,
      speed: obj.speed,
      heading: obj.heading,
      updated_at: new Date(),
    };
  }
}

module.exports = PrismaUserLocationRepository;
