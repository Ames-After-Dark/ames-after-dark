const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getEvents = async () => {
  return prisma.events.findMany({
    include: {
      locations: true,
      weekdays: true
    },
    orderBy: { id: 'asc' },
  });
};

exports.getEventById = async (id) => {
  return prisma.events.findUnique({
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

exports.createEvent = async (eventData) => {
  return prisma.events.create({
    data: {
      ...eventData,
      location_id: eventData.location_id ? Number(eventData.location_id) : null,
      weekday_id: eventData.weekday_id ? Number(eventData.weekday_id) : null,
      date: eventData.date ? new Date(eventData.date) : null,
      start_time: eventData.start_time ? new Date(eventData.start_time) : null,
      end_time: eventData.end_time ? new Date(eventData.end_time) : null,
    },
    include: {
      locations: true,
      weekdays: true
    }
  });
};

exports.updateEvent = async (id, eventData) => {
  return prisma.events.update({
    where: { id: Number(id) },
    data: {
      ...eventData,
      location_id: eventData.location_id ? Number(eventData.location_id) : undefined,
      weekday_id: eventData.weekday_id ? Number(eventData.weekday_id) : undefined,
      date: eventData.date ? new Date(eventData.date) : undefined,
      start_time: eventData.start_time ? new Date(eventData.start_time) : undefined,
      end_time: eventData.end_time ? new Date(eventData.end_time) : undefined,
    },
    include: {
      locations: true,
      weekdays: true
    }
  });
};

exports.deleteEvent = async (id) => {
  return prisma.events.delete({
    where: { id: Number(id) }
  });
};

exports.getActiveEvents = async () => {
  const now = new Date();
  const currentWeekday = now.getDay(); // Sunday=0, Monday=1, ..., Saturday=6
  const weekdayId = currentWeekday === 0 ? 7 : currentWeekday; // Adjust if your DB uses 1=Monday, 7=Sunday
  const currentTime = now.toTimeString().slice(0,5); // "HH:mm"

  return prisma.events.findMany({
    where: {
      weekday_id: weekdayId,
      start_time: { lte: now },
      end_time: { gte: now }
    },
    include: {
      locations: true,
      weekdays: true
    }
  });
};

exports.getEventsByLocationId = async (locationId) => {
  return prisma.events.findMany({
    where: { location_id: Number(locationId) },
    include: {
      locations: true,
      weekdays: true
    }
  });
};