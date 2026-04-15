const ILocationRepository = require('../../domain/repositories/ILocationRepository');
const Location = require('../../domain/aggregates/Location');
const Coordinates = require('../../domain/value-objects/Coordinates');
const { DateTime } = require('luxon');

/**
 * Prisma implementation of Location Repository
 * Handles persistence of Location aggregates
 */
class PrismaLocationRepository extends ILocationRepository {
  constructor(prismaClient) {
    super();
    this.prisma = prismaClient;
  }

  /**
   * Convert Prisma model to Location aggregate
   */
  toDomain(raw) {
    if (!raw) return null;

    const coordinates = new Coordinates(
      parseFloat(raw.latitude),
      parseFloat(raw.longitude)
    );

    return new Location(raw.id, raw.name, coordinates, {
      address: raw.address,
      description: raw.description,
      timezone: raw.timezone,
      isOpen: raw.open,
      views: raw.views,
      tags: raw.tags,
      type: raw.location_type_id,
      zone: raw.zone_id,
      nickname: raw.nickname,
      phoneNumber: null, // Add if needed in schema
      website: null, // Add if needed in schema
      imageUrl: null, // Add if needed in schema
    });
  }

  /**
   * Convert Location aggregate to Prisma save format
   */
  toPersistence(location) {
    return {
      name: location.name,
      address: location.address,
      latitude: location.coordinates.latitude,
      longitude: location.coordinates.longitude,
      description: location.description,
      timezone: location.timezone,
      open: location.isOpen,
      views: location.views,
      tags: location.tags,
      nickname: location.nickname,
    };
  }

  async findById(id) {
    const raw = await this.prisma.locations.findUnique({
      where: { id: Number(id) },
    });
    return this.toDomain(raw);
  }

  async findAll() {
    const raw = await this.prisma.locations.findMany({
      orderBy: { id: 'asc' },
    });
    return raw.map(r => this.toDomain(r));
  }

  async findByCoordinates(coordinates, radiusKm = 5) {
    // Get all locations and filter in memory (Prisma doesn't support spatial queries well)
    const all = await this.findAll();
    return all.filter(loc => loc.isNear(coordinates, radiusKm));
  }

  async findOpen(timezone = 'UTC') {
    const currentUtc = new Date();
    const locations = await this.findAll();

    return locations.filter(loc => {
      const activeOverrides = []; // TODO: Implement with location_hours_overrides
      const override = activeOverrides.find(o =>
        currentUtc >= o.start_time_utc && currentUtc <= o.end_time_utc
      );

      if (override) {
        return override.is_open;
      }

      // Convert to local time
      const locationTime = DateTime.fromJSDate(currentUtc).setZone(
        loc.timezone || 'UTC'
      );
      const currentTimeStr = locationTime.toFormat('HH:mm');
      let todayId = locationTime.weekday + 1;
      if (todayId > 7) todayId = 1;

      // TODO: Implement with location_hours table
      return loc.isOpen;
    });
  }

  async save(location) {
    const data = this.toPersistence(location);

    const saved = await this.prisma.locations.upsert({
      where: { id: location.id || 0 },
      create: data,
      update: data,
    });

    return this.toDomain(saved);
  }

  async delete(id) {
    await this.prisma.locations.delete({
      where: { id: Number(id) },
    });
  }

  async countViews(id) {
    const location = await this.prisma.locations.findUnique({
      where: { id: Number(id) },
      select: { views: true },
    });
    return location?.views || 0;
  }

  async recordView(id) {
    return await this.prisma.locations.update({
      where: { id: Number(id) },
      data: { views: { increment: 1 } },
    });
  }
}

module.exports = PrismaLocationRepository;
