const IBannerRepository = require('../../domain/repositories/IBannerRepository');
const Banner = require('../../domain/entities/Banner');
const prisma = require('../../db');

class PrismaBannerRepository extends IBannerRepository {
  async findById(id) {
    const raw = await prisma.banners.findUnique({ where: { id } });
    return raw ? this.toDomain(raw) : null;
  }

  async findActive() {
    const now = new Date();
    const raw = await prisma.banners.findMany({
      where: {
        is_active: true,
        start_date: { lte: now },
        end_date: { gte: now },
      },
      orderBy: { priority: 'desc' },
    });
    return raw.map(r => this.toDomain(r));
  }

  async findAll() {
    const raw = await prisma.banners.findMany({ orderBy: { created_at: 'desc' } });
    return raw.map(r => this.toDomain(r));
  }

  async save(banner) {
    const exists = await prisma.banners.findUnique({ where: { id: banner.id } });
    const data = this.toPersistence(banner);

    if (exists) {
      return this.toDomain(
        await prisma.banners.update({ where: { id: banner.id }, data })
      );
    } else {
      return this.toDomain(await prisma.banners.create({ data }));
    }
  }

  async delete(id) {
    await prisma.banners.delete({ where: { id } });
  }

  toDomain(raw) {
    return new Banner(raw.id, raw.title, raw.content, raw.image_url, {
      isActive: raw.is_active,
      startDate: raw.start_date,
      endDate: raw.end_date,
      priority: raw.priority,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }

  toPersistence(domain) {
    const obj = domain.toObject();
    return {
      title: obj.title,
      content: obj.content,
      image_url: obj.imageUrl,
      is_active: obj.isActive,
      start_date: obj.startDate,
      end_date: obj.endDate,
      priority: obj.priority,
      updated_at: new Date(),
    };
  }
}

module.exports = PrismaBannerRepository;
