const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


/**
 * Fetches all recurring hours and overrides for a single location.
 */
exports.getHoursByLocationId = async (locationId) => {
  return await prisma.locations.findUnique({
    where: { id: locationId },
    select: {
      id: true,
      name: true,
      timezone: true,
      location_hours: {
        orderBy: { weekday_id: 'asc' }
      },
      location_hours_overrides: {
        where: {
          end_time_utc: { gte: new Date() } // Only show current/future overrides
        },
        orderBy: { start_time_utc: 'asc' }
      }
    }
  });
};

/**
 * Replace the entire weekly schedule for a location.
 * Using a transaction ensures we don't delete hours and then fail to add new ones.
 */
exports.updateWeeklyHours = async (locationId, hoursArray) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Clear existing hours
    await tx.location_hours.deleteMany({
      where: { location_id: locationId }
    });

    // 2. Insert new schedule
    return await tx.location_hours.createMany({
      data: hoursArray.map(h => ({
        location_id: locationId,
        weekday_id: h.weekday_id,
        open_time: h.open_time,
        close_time: h.close_time
      }))
    });
  });
};

exports.createOverride = async (locationId, overrideData) => {
  return await prisma.location_hours_overrides.create({
    data: {
      location_id: locationId,
      start_time_utc: new Date(overrideData.start_time_utc),
      end_time_utc: new Date(overrideData.end_time_utc),
      is_open: overrideData.is_open,
      reason: overrideData.reason
    }
  });
};

exports.deleteOverride = async (overrideId) => {
  return await prisma.location_hours_overrides.delete({
    where: { id: overrideId }
  });
};