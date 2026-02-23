const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getMenuItemById = async (id) => {
  return prisma.menu_items.findUnique({
    where: { id: Number(id) }
  });
};

exports.createMenuItem = async (menuItemData) => {
  return prisma.menu_items.create({
    data: {
      ...menuItemData,
      location_id: menuItemData.location_id ? Number(menuItemData.location_id) : null,
    }
  });
};

exports.updateMenuItem = async (id, menuItemData) => {
  return prisma.menu_items.update({
    where: { id: Number(id) },
    data: {
      ...menuItemData,
      location_id: menuItemData.location_id ? Number(menuItemData.location_id) : undefined,
    }
  });
};

exports.deleteMenuItem = async (id) => {
  return prisma.menu_items.delete({
    where: { id: Number(id) }
  });
};

exports.getMenuItemsByLocationId = async (locationId) => {
  return prisma.menu_items.findMany({
    where: { location_id: Number(locationId) }
  });
};