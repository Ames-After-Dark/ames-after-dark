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
      deal_weekdays: {
        include: {
          weekdays: true
        }
      }
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
      deal_weekdays: {
        include: {
          weekdays: true
        }
      }
    }
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
  const currentWeekday = now.getDay(); // JS: 0=Sunday, 6=Saturday
  // 1=Sunday, 7=Saturday
  const weekdayId = currentWeekday === 0 ? 1 : currentWeekday === 6 ? 7 : currentWeekday + 1;
  const currentTime = now.toTimeString().slice(0,5); // "HH:mm"

  return prisma.deals.findMany({
    where: {
      deal_weekdays: {
        some: {
          weekday_id: weekdayId
        }
      },
      start_time: { lte: currentTime },
      end_time: { gte: currentTime }
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

exports.getDealsByLocationId = async (locationId) => {
  return prisma.deals.findMany({
    where: { location_id: Number(locationId) },
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