const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getEvents = async () => {
  return prisma.events.findMany({
    orderBy: { id: 'asc' },
  });
};

exports.getEventById = async (id) => {
  return prisma.events.findUnique({
    where: { id: Number(id) },
  });
};

exports.createEvent = async (eventData) => {
  const { weekdays, ...rest } = eventData;
  return prisma.events.create({
    data: {
      ...rest,
      location_id: eventData.location_id ? Number(eventData.location_id) : null,
      date: eventData.date ? new Date(eventData.date) : null,
      start_time: eventData.start_time ? new Date(eventData.start_time) : null,
      end_time: eventData.end_time ? new Date(eventData.end_time) : null,
      event_weekdays: weekdays && weekdays.length > 0
        ? {
            create: weekdays.map((weekday_id) => ({ weekday_id }))
          }
        : undefined
    },
    include: {
      locations: true,
      event_weekdays: {
        include: {
          weekdays: true
        }
      }
    }
  });
};

exports.updateEvent = async (id, eventData) => {
  const { weekdays, ...rest } = eventData;
  return prisma.events.update({
    where: { id: Number(id) },
    data: {
      ...rest,
      location_id: eventData.location_id ? Number(eventData.location_id) : undefined,
      date: eventData.date ? new Date(eventData.date) : undefined,
      start_time: eventData.start_time ? new Date(eventData.start_time) : undefined,
      end_time: eventData.end_time ? new Date(eventData.end_time) : undefined,
      event_weekdays: weekdays && weekdays.length > 0
        ? {
            deleteMany: {},
            create: weekdays.map((weekday_id) => ({ weekday_id }))
          }
        : undefined
    },
    include: {
      locations: true,
      event_weekdays: {
        include: {
          weekdays: true
        }
      }
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
  const currentWeekday = now.getDay(); // JS: 0=Sunday, 6=Saturday
  // 1=Sunday, 7=Saturday
  const weekdayId = currentWeekday === 0 ? 1 : currentWeekday === 6 ? 7 : currentWeekday + 1;
  const currentTime = now.toTimeString().slice(0,5); // "HH:mm"

  return prisma.events.findMany({
    where: {
      event_weekdays: {
        some: {
          weekday_id: weekdayId
        }
      },
      start_time: { lte: now },
      end_time: { gte: now }
    },
    include: {
      locations: true,
      event_weekdays: {
        include: {
          weekdays: true
        }
      }
    }
  });
};

exports.getEventsByLocationId = async (locationId) => {
  return prisma.events.findMany({
    where: { location_id: Number(locationId) },
    include: {
      locations: true,
      event_weekdays: {
        include: {
          weekdays: true
        }
      }
    }
  });
};