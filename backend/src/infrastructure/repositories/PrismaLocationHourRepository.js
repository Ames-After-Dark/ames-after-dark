const ILocationHourRepository = require('../../domain/repositories/ILocationHourRepository');
const LocationHour = require('../../domain/entities/LocationHour');
const prisma = require('../../db');

class PrismaLocationHourRepository extends ILocationHourRepository {
  async findById(id) {
    const raw = await prisma.location_hours.findUnique({ where: { id } });
    return raw ? this.toDomain(raw) : null;
  }

  async findByLocationId(locationId) {
    const raw = await prisma.location_hours.findMany({
      where: { location_id: locationId },
      orderBy: { day_of_week: 'asc' },
    });
    return raw.map(r => this.toDomain(r));
  }

  async findByLocationAndDay(locationId, dayOfWeek) {
    const raw = await prisma.location_hours.findFirst({
      where: { location_id: locationId, day_of_week: dayOfWeek },
    });
    return raw ? this.toDomain(raw) : null;
  }

  async save(locationHour) {
    const exists = await prisma.location_hours.findUnique({ where: { id: locationHour.id } });
    const data = this.toPersistence(locationHour);

    if (exists) {
      return this.toDomain(
        await prisma.location_hours.update({ where: { id: locationHour.id }, data })
      );
    } else {
      return this.toDomain(await prisma.location_hours.create({ data }));
    }
  }

  async delete(id) {
    await prisma.location_hours.delete({ where: { id } });
  }

  toDomain(raw) {
    return new LocationHour(raw.id, raw.location_id, raw.day_of_week, raw.open_time, raw.close_time, {
      isOpen: raw.is_open,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }

  toPersistence(domain) {
    const obj = domain.toObject();
    return {
      location_id: obj.locationId,
      day_of_week: obj.dayOfWeek,
      open_time: obj.openTime,
      close_time: obj.closeTime,
      is_open: obj.isOpen,
      updated_at: new Date(),
    };
  }
}

module.exports = PrismaLocationHourRepository;
