const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDeals = async () => {
  return prisma.deals.findMany({
    orderBy: { id: 'asc' },
  });
};

exports.getDealById = async (id) => {
  return prisma.deals.findUnique({
    where: { id: Number(id) }
  });
};

exports.createDeal = async (dealData) => {
  return prisma.deals.create({
    data: {
      ...dealData,
      location_id: dealData.location_id ? Number(dealData.location_id) : null,
      weekday_id: dealData.weekday_id ? Number(dealData.weekday_id) : null,
      date: dealData.date ? new Date(dealData.date) : null,
    },
    include: {
      locations: true,
      weekdays: true
    }
  });
};

exports.updateDeal = async (id, dealData) => {
  return prisma.deals.update({
    where: { id: Number(id) },
    data: {
      ...dealData,
      location_id: dealData.location_id ? Number(dealData.location_id) : undefined,
      weekday_id: dealData.weekday_id ? Number(dealData.weekday_id) : undefined,
      date: dealData.date ? new Date(dealData.date) : undefined,
    },
    include: {
      locations: true,
      weekdays: true
    }
  });
};

exports.deleteDeal = async (id) => {
  return prisma.deals.delete({
    where: { id: Number(id) }
  });
};