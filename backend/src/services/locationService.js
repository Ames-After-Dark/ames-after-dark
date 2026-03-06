const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { DateTime } = require('luxon');

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

/**
 * Get open locations at a given UTC time.
 * @param {Date} currentUtc - The current UTC timestamp from the frontend
 */
exports.getOpenLocations = async (currentUtc = new Date()) => {
  const dateObj = currentUtc instanceof Date ? currentUtc : new Date(currentUtc);

  const locations = await prisma.locations.findMany({
    include: {
      location_hours: true,
      location_hours_overrides: true
    },
  });

  return locations.filter((loc) => {
    // 1. OVERRIDES (UTC)
    const activeOverride = loc.location_hours_overrides.find((o) => {
      return dateObj >= o.start_time_utc && dateObj <= o.end_time_utc;
    });
    if (activeOverride) return activeOverride.is_open;

    // 2. TRANSLATE TO LOCAL WALL TIME
    const locationTime = DateTime.fromJSDate(dateObj).setZone(loc.timezone || 'UTC');
    const currentTimeStr = locationTime.toFormat('HH:mm'); 

    // 3. CONVERT LUXON WEEKDAY TO YOUR DB WEEKDAY (Sun=1...Sat=7)
    // Luxon: Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6, Sun=7
    // Your DB: Sun=1, Mon=2, Tue=3, Wed=4, Thu=5, Fri=6, Sat=7
    let todayId = locationTime.weekday + 1; 
    if (todayId > 7) todayId = 1; // Wrap Sunday back to 1

    // Calculate Yesterday's ID for the overnight check
    const yesterdayId = todayId === 1 ? 7 : todayId - 1;

    // 4. CHECK RECURRING HOURS
    return loc.location_hours.some((h) => {
      const isOvernight = h.close_time < h.open_time;

      if (!isOvernight) {
        // Standard: e.g., Sun 10:00 - Sun 22:00
        return h.weekday_id === todayId && 
               currentTimeStr >= h.open_time && 
               currentTimeStr <= h.close_time;
      } else {
        // Overnight: e.g., Sun 20:00 - Mon 02:00
        
        // Started Today? (e.g., It's Sunday 11 PM)
        const isFirstHalf = h.weekday_id === todayId && currentTimeStr >= h.open_time;
        
        // Started Yesterday? (e.g., It's Monday 1 AM, we check Sunday's rule)
        const isSecondHalf = h.weekday_id === yesterdayId && currentTimeStr <= h.close_time;

        return isFirstHalf || isSecondHalf;
      }
    });
  });
};

exports.getLocationsWithHours = async () => {
  return await prisma.locations.findMany({
    include: {
      location_hours: {
        orderBy: {
          weekday_id: 'asc'
        }
      }
    },
    orderBy: {
      id: 'asc'
    }
  });
};

exports.getLocationsByAdminId = async (adminId) => {
  return prisma.locations.findMany({
    where: { 
      location_admins: {
        some: {
          user_id: Number(adminId)
        }
      }
    }
  });
};

exports.getTotalLocationViews = async (locationId) => {
  const locId = Number(locationId);

  const [location, eventsAgg, dealsAgg] = await Promise.all([
    prisma.locations.findUnique({
      where: { id: locId },
      select: { views: true }
    }),
    prisma.events.aggregate({
      where: { location_id: locId },
      _sum: { views: true }
    }),
    prisma.deals.aggregate({
      where: { location_id: locId },
      _sum: { views: true }
    })
  ]);

  if (!location) {
    throw new Error("Location not found");
  }

  const baseViews = location.views || 0;
  const eventViews = eventsAgg._sum.views || 0;
  const dealViews = dealsAgg._sum.views || 0;

  return {
    locationId: locId,
    breakdown: {
      locationViews: baseViews,
      eventViews: eventViews,
      dealViews: dealViews
    },
    totalViews: baseViews + eventViews + dealViews
  };
};