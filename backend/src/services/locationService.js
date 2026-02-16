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

function pad(n) {
  return n.toString().padStart(2, '0');
}

exports.getOpenLocations = async () => {
  const now = new Date();
  const currentWeekday = now.getUTCDay() + 1;
  const currentTimeUTC = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:00`;

  //const currentTimeUTC = new Date(Date.UTC(1970, 0, 1, now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));

  // TODO: This is all goofy

  //console.log(`Current UTC time: ${currentTimeUTC}, Weekday ID: ${currentWeekday}`);

  // Find locations with at least one location_hours entry matching current weekday and time (all in UTC)
  return prisma.locations.findMany({
    where: {
      location_hours: {
        some: {
          weekday_id: currentWeekday,
          open_time_utc: { lte: currentTimeUTC },
          close_time_utc: { gte: currentTimeUTC }
        }
      }
    }
  });
};

// Get locations with their hours included
exports.getLocationsWithHours = async () => {
  return prisma.locations.findMany({
    include: {
      location_hours: {
        include: {
          weekdays: true
        }
      }
    },
    orderBy: { id: 'asc' }
  });
};