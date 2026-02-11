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
  const { weekdays, ...rest } = dealData;
  return prisma.deals.create({
    data: {
      ...rest,
      location_id: dealData.location_id ? Number(dealData.location_id) : null,
      date: dealData.date ? new Date(dealData.date) : null,
      deal_weekdays: weekdays && weekdays.length > 0
        ? {
            create: weekdays.map((weekday_id) => ({ weekday_id }))
          }
        : undefined
    },
    include: {
      locations: true,
      deal_weekdays: {
        include: {
          weekdays: true
        }
      }
    }
  });
};

exports.updateDeal = async (id, dealData) => {
  const { weekdays, ...rest } = dealData;
  return prisma.deals.update({
    where: { id: Number(id) },
    data: {
      ...rest,
      location_id: dealData.location_id ? Number(dealData.location_id) : undefined,
      date: dealData.date ? new Date(dealData.date) : undefined,
      deal_weekdays: weekdays && weekdays.length > 0
        ? {
            deleteMany: {},
            create: weekdays.map((weekday_id) => ({ weekday_id }))
          }
        : undefined
    },
    include: {
      locations: true,
      deal_weekdays: {
        include: {
          weekdays: true
        }
      }
    }
  });
};

exports.deleteDeal = async (id) => {
  return prisma.deals.delete({
    where: { id: Number(id) }
  });
};

exports.getActiveDeals = async () => {
  const now = new Date();
  // JS: 0=Sunday, 6=Saturday. DB: 1=Sunday, 7=Saturday
  let weekdayId = now.getDay();
  weekdayId = weekdayId === 0 ? 1 : weekdayId + 1;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentTime = new Date(today.getTime() + (now.getHours() * 3600000) + (now.getMinutes() * 60000) + (now.getSeconds() * 1000));

  return prisma.deals.findMany({
    where: {
      deal_weekdays: {
        some: {
          weekday_id: weekdayId
        }
      },
      start_time_utc: { lte: currentTime },
      end_time_utc: { gte: currentTime }
    }
  });
};

exports.getDealsByLocationId = async (locationId) => {
  return prisma.deals.findMany({
    where: { location_id: Number(locationId) }
  });
};