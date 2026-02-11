const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getLocations = async () => {
  return prisma.locations.findMany({
    orderBy: { id: 'asc' },
    include: {
      deals: {
        include: {
          deal_weekdays: {
            include: { weekdays: true }
          }
        }
      },
      events: {
        include: {
          event_weekdays: {
            include: { weekdays: true }
          }
        }
      },
      location_hours: { include: { weekdays: true } },
      location_types: true,
      user_favorites: { include: { users: true } },
    },
  });
};

exports.getLocationById = async (id) => {
  return prisma.locations.findUnique({
    where: { id: Number(id) },
    include: {
      deals: {
        include: {
          deal_weekdays: {
            include: { weekdays: true }
          }
        }
      },
      events: {
        include: {
          event_weekdays: {
            include: { weekdays: true }
          }
        }
      },
      location_hours: { include: { weekdays: true } },
      location_types: true,
      user_favorites: { include: { users: true } },
    },
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

exports.getOpenLocations = async () => {
  const now = new Date();
  const currentWeekday = now.getDay();
  const weekdayId = currentWeekday === 0 ? 7 : currentWeekday;
  const currentTime = now.toTimeString().slice(0,5); // "HH:mm"

  // Find locations with at least one location_hours entry matching current weekday and time
  return prisma.locations.findMany({
    include: {
      location_hours: true,
      location_types: true,
      deals: {
        include: {
          deal_weekdays: {
            include: { weekdays: true }
          }
        }
      },
      events: {
        include: {
          event_weekdays: {
            include: { weekdays: true }
          }
        }
      },
      user_favorites: true
    },
    where: {
      location_hours: {
        some: {
          weekday_id: weekdayId,
          open_time_: { lte: now },
          close_time: { gte: now }
        }
      }
    }
  });
};