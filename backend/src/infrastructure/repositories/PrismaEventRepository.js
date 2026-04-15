const IEventRepository = require('../../domain/repositories/IEventRepository');
const Event = require('../../domain/entities/Event');
const prisma = require('../../db');

class PrismaEventRepository extends IEventRepository {
  async findById(id) {
    const raw = await prisma.events.findUnique({
      where: { id },
    });
    return raw ? this.toDomain(raw) : null;
  }

  async findByLocationId(locationId) {
    const raw = await prisma.events.findMany({
      where: { location_id: locationId },
      orderBy: { start_time: 'asc' },
    });
    return raw.map(r => this.toDomain(r));
  }

  async findUpcoming(days = 7) {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const raw = await prisma.events.findMany({
      where: {
        start_time: {
          gte: now,
          lte: futureDate,
        },
      },
      orderBy: { start_time: 'asc' },
    });
    return raw.map(r => this.toDomain(r));
  }

  async findAll() {
    const raw = await prisma.events.findMany({
      orderBy: { created_at: 'desc' },
    });
    return raw.map(r => this.toDomain(r));
  }

  async save(event) {
    const exists = await prisma.events.findUnique({
      where: { id: event.id },
    });

    const data = this.toPersistence(event);

    if (exists) {
      return this.toDomain(
        await prisma.events.update({
          where: { id: event.id },
          data,
        })
      );
    } else {
      return this.toDomain(
        await prisma.events.create({
          data,
        })
      );
    }
  }

  async delete(id) {
    await prisma.events.delete({
      where: { id },
    });
  }

  toDomain(raw) {
    return new Event(
      raw.id,
      raw.title,
      raw.description,
      raw.start_time,
      raw.end_time,
      raw.location_id,
      {
        attendeeCount: raw.attendee_count,
        imageUrl: raw.image_url,
        createdAt: raw.created_at,
        updatedAt: raw.updated_at,
      }
    );
  }

  toPersistence(domain) {
    const obj = domain.toObject();
    return {
      title: obj.title,
      description: obj.description,
      start_time: obj.startTime,
      end_time: obj.endTime,
      location_id: obj.locationId,
      attendee_count: obj.attendeeCount,
      image_url: obj.imageUrl,
      updated_at: new Date(),
    };
  }
}

module.exports = PrismaEventRepository;
