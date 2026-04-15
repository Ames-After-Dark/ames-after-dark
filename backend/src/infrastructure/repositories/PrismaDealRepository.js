const IDealRepository = require('../../domain/repositories/IDealRepository');
const Deal = require('../../domain/entities/Deal');
const prisma = require('../../db');

class PrismaDealRepository extends IDealRepository {
  async findById(id) {
    const raw = await prisma.deals.findUnique({ where: { id } });
    return raw ? this.toDomain(raw) : null;
  }

  async findByLocationId(locationId) {
    const raw = await prisma.deals.findMany({
      where: { location_id: locationId },
      orderBy: { created_at: 'desc' },
    });
    return raw.map(r => this.toDomain(r));
  }

  async findActive() {
    const now = new Date();
    const raw = await prisma.deals.findMany({
      where: {
        is_active: true,
        start_date: { lte: now },
        end_date: { gte: now },
      },
    });
    return raw.map(r => this.toDomain(r));
  }

  async findAll() {
    const raw = await prisma.deals.findMany({ orderBy: { created_at: 'desc' } });
    return raw.map(r => this.toDomain(r));
  }

  async save(deal) {
    const exists = await prisma.deals.findUnique({ where: { id: deal.id } });
    const data = this.toPersistence(deal);

    if (exists) {
      return this.toDomain(
        await prisma.deals.update({ where: { id: deal.id }, data })
      );
    } else {
      return this.toDomain(await prisma.deals.create({ data }));
    }
  }

  async delete(id) {
    await prisma.deals.delete({ where: { id } });
  }

  toDomain(raw) {
    return new Deal(raw.id, raw.title, raw.description, raw.discount, raw.location_id, {
      isActive: raw.is_active,
      startDate: raw.start_date,
      endDate: raw.end_date,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }

  toPersistence(domain) {
    const obj = domain.toObject();
    return {
      title: obj.title,
      description: obj.description,
      discount: obj.discount,
      location_id: obj.locationId,
      is_active: obj.isActive,
      start_date: obj.startDate,
      end_date: obj.endDate,
      updated_at: new Date(),
    };
  }
}

module.exports = PrismaDealRepository;
