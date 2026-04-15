const IMenuItemRepository = require('../../domain/repositories/IMenuItemRepository');
const MenuItem = require('../../domain/entities/MenuItem');
const prisma = require('../../db');

class PrismaMenuItemRepository extends IMenuItemRepository {
  async findById(id) {
    const raw = await prisma.menu_items.findUnique({ where: { id } });
    return raw ? this.toDomain(raw) : null;
  }

  async findByLocationId(locationId) {
    const raw = await prisma.menu_items.findMany({
      where: { location_id: locationId },
      orderBy: { created_at: 'asc' },
    });
    return raw.map(r => this.toDomain(r));
  }

  async findAll() {
    const raw = await prisma.menu_items.findMany();
    return raw.map(r => this.toDomain(r));
  }

  async save(menuItem) {
    const exists = await prisma.menu_items.findUnique({ where: { id: menuItem.id } });
    const data = this.toPersistence(menuItem);

    if (exists) {
      return this.toDomain(
        await prisma.menu_items.update({ where: { id: menuItem.id }, data })
      );
    } else {
      return this.toDomain(await prisma.menu_items.create({ data }));
    }
  }

  async delete(id) {
    await prisma.menu_items.delete({ where: { id } });
  }

  toDomain(raw) {
    return new MenuItem(
      raw.id,
      raw.location_id,
      raw.name,
      raw.description,
      raw.price,
      {
        category: raw.category,
        imageUrl: raw.image_url,
        isAvailable: raw.is_available,
        createdAt: raw.created_at,
        updatedAt: raw.updated_at,
      }
    );
  }

  toPersistence(domain) {
    const obj = domain.toObject();
    return {
      location_id: obj.locationId,
      name: obj.name,
      description: obj.description,
      price: obj.price,
      category: obj.category,
      image_url: obj.imageUrl,
      is_available: obj.isAvailable,
      updated_at: new Date(),
    };
  }
}

module.exports = PrismaMenuItemRepository;
