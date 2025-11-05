const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getLocations = async () => {
  return await prisma.locations.findMany({
    orderBy: { id: 'asc' }
  });
};

exports.getLocationById = async (id) => {
  return await prisma.locations.findUnique({
    where: { id: Number(id) }
  });
};

exports.createLocation = async (location) => {
  return await prisma.locations.create({
    data: {
      name: location.name,
      address: location.address ?? null,
      latitude: location.latitude ?? null,
      longitude: location.longitude ?? null,
      description: location.description ?? null,
      open: location.open ?? null,
      tags: location.tags ?? null,
      views: location.views ?? 0,
      nickname: location.nickname ?? null
    }
  });
};

exports.updateLocation = async (id, location) => {
  return await prisma.locations.update({
    where: { id: Number(id) },
    data: {
      name: location.name,
      address: location.address ?? null,
      latitude: location.latitude ?? null,
      longitude: location.longitude ?? null,
      description: location.description ?? null,
      open: location.open ?? null,
      tags: location.tags ?? null,
      views: location.views ?? 0,
      nickname: location.nickname ?? null
    }
  });
};

exports.deleteLocation = async (id) => {
  return await prisma.locations.delete({
    where: { id: Number(id) }
  });
};
