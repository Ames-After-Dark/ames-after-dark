const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getLocations = async () => {
  return prisma.locations.findMany({
    orderBy: { id: 'asc' }
  });
};

exports.getLocationById = async (id) => {
  return prisma.locations.findUnique({
    where: { id: Number(id) }
  });
};

exports.createLocation = async (location) => {
  return prisma.locations.create({
    data: {
      ...location,
      views: location.views ?? 0,
    },
  });
};

exports.updateLocation = async (id, location) => {
  return prisma.locations.update({
    where: { id: Number(id) },
    data: {
      ...location,
      views: location.views ?? 0,
    },
  });
};

exports.deleteLocation = async (id) => {
  return prisma.locations.delete({
    where: { id: Number(id) },
  });
};
