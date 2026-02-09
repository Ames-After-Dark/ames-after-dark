const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDeals = async () => {
  return prisma.deals.findMany({
    include: {
      locations: {
        include: {
          location_types: true,
          location_hours: {
            include: {
              weekdays: true
            }
          }
        }
      },
      weekdays: true
    },
    orderBy: { id: 'asc' },
  });
};

exports.getDealById = async (id) => {
  return prisma.deals.findUnique({
    where: { id: Number(id) },
    include: {
      locations: {
        include: {
          location_types: true,
          location_hours: {
            include: {
              weekdays: true
            }
          }
        }
      },
      weekdays: true
    }
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

exports.getActiveDeals = async () => {
  const now = new Date();
  const currentWeekday = now.getDay();
  //console.log('Current weekday:', currentWeekday);
  const currentTime = now.toTimeString().slice(0,5); // "HH:mm"
  //console.log('Current time:', currentTime);

  // TODO: I can't remember my logic here.
  const weekdayId = currentWeekday === 0 ? 7 : currentWeekday; // If Sunday=0, map to 7

  return prisma.deals.findMany({
    where: {
      weekday_id: weekdayId,
      start_time: { lte: currentTime },
      end_time: { gte: currentTime }
    },
    include: {
      locations: true,
      weekdays: true
    }
  });
};

exports.getDealsByLocationId = async (locationId) => {
  return prisma.deals.findMany({
    where: { location_id: Number(locationId) },
    include: {
      locations: true,
      weekdays: true
    }
  });
};