const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getEvents = async () => {
  return prisma.events.findMany({
    orderBy: { id: 'asc' },
    include: {
      locations: true,
      event_occurrences: true
    }
  });
};

exports.getEventById = async (id) => {
  return prisma.events.findUnique({
    where: { id: Number(id) },
    include: {
      locations: true,
      event_occurrences: true
    }
  });
};

exports.createEvent = async (eventData) => {
  const { occurrences, ...rest } = eventData;

  return prisma.events.create({
    data: {
      ...rest,
      location_id: eventData.location_id ? Number(eventData.location_id) : null,
      event_occurrences: occurrences && occurrences.length > 0
        ? {
          create: occurrences.map((o) => ({
            start_time_utc: new Date(o.start_time_utc),
            end_time_utc: new Date(o.end_time_utc)
          }))
        }
        : undefined
    },
    include: {
      locations: true,
      event_occurrences: true
    }
  });
};

exports.updateEvent = async (id, eventData) => {
  const { occurrences, ...rest } = eventData;

  return prisma.events.update({
    where: { id: Number(id) },
    data: {
      ...rest,
      location_id: eventData.location_id ? Number(eventData.location_id) : undefined,
      event_occurrences: occurrences && occurrences.length > 0
        ? {
          deleteMany: {}, // delete old occurrences
          create: occurrences.map((o) => ({
            start_time_utc: new Date(o.start_time_utc),
            end_time_utc: new Date(o.end_time_utc)
          }))
        }
        : undefined
    },
    include: {
      locations: true,
      event_occurrences: true
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

  return prisma.event_occurrences.findMany({
    where: {
      start_time_utc: { lte: now },
      end_time_utc: { gte: now }
    },
    include: {
      events: {
        include: {
          locations: true
        }
      }
    }
  });
};

exports.getEventsByLocationId = async (locationId, includeHistory = false) => {
  const now = new Date();
  return prisma.events.findMany({
    where: {
      location_id: Number(locationId),
      ...(includeHistory ? {} : { event_occurrences: { some: { end_time_utc: { gte: now } } } })
    },
    include: {
      event_occurrences: includeHistory ? true : {
        where: { end_time_utc: { gte: now } },
        orderBy: { start_time_utc: 'asc' }
      },
      locations: true
    },
    orderBy: { id: 'asc' }
  });
};

exports.createRecurringEvent = async (eventData) => {
  const { name, location_id, start_time, end_time, start_date, end_date, weekdays } = eventData;

  // Create the event template first
  const event = await prisma.events.create({
    data: { name, location_id: Number(location_id) },
  });

  // Parse dates
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);

  // Generate occurrences
  const occurrences = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const jsWeekday = d.getUTCDay(); // 0=Sunday, 6=Saturday
    const dbWeekday = jsWeekday === 0 ? 1 : jsWeekday + 1; // map to 1-7 if needed

    if (weekdays.includes(dbWeekday)) {
      const [startHour, startMin, startSec] = start_time.split(':').map(Number);
      const [endHour, endMin, endSec] = end_time.split(':').map(Number);

      const occurrenceStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), startHour, startMin, startSec));
      const occurrenceEnd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), endHour, endMin, endSec));

      occurrences.push({
        event_id: event.id,
        start_time_utc: occurrenceStart,
        end_time_utc: occurrenceEnd
      });
    }
  }

  // Insert occurrences in bulk
  await prisma.event_occurrences.createMany({
    data: occurrences
  });

  return {
    event,
    occurrences
  };
};

exports.searchEvents = async (searchParams) => {
  const { id, startDateTime, endDateTime, locationId } = searchParams;

  // Build the where clause for event_occurrences
  const occurrenceWhere = {};
  if (startDateTime) {
    occurrenceWhere.start_time_utc = { gte: new Date(startDateTime) };
  }
  if (endDateTime) {
    occurrenceWhere.end_time_utc = { lte: new Date(endDateTime) };
  }

  // If we have date filters, search through occurrences to get events
  if (startDateTime || endDateTime) {
    let occurrences = await prisma.event_occurrences.findMany({
      where: occurrenceWhere,
      include: {
        events: {
          include: {
            locations: true
          }
        }
      }
    });

    if (locationId) {
      // Filter occurrences by locationId
      occurrences = occurrences.filter(o => o.events.location_id === Number(locationId));
    }

    // If id is specified, filter occurrences by event id
    if (id) {
      return occurrences.filter(o => o.events.id === Number(id));
    }

    // Remove duplicates and return events
    const eventsMap = new Map();
    occurrences.forEach(o => {
      const event = { ...o.events, event_occurrences: [] };
      if (!eventsMap.has(event.id)) {
        eventsMap.set(event.id, event);
      }
      eventsMap.get(event.id).event_occurrences.push({
        id: o.id,
        event_id: o.event_id,
        start_time_utc: o.start_time_utc,
        end_time_utc: o.end_time_utc
      });
    });

    return Array.from(eventsMap.values());
  }

  // If only id is specified
  if (id) {
    const event = await prisma.events.findUnique({
      where: { id: Number(id) },
      include: {
        locations: true,
        event_occurrences: true
      }
    });
    return event ? [event] : [];
  }

  // No filters - return all events
  return prisma.events.findMany({
    orderBy: { id: 'asc' },
    include: {
      locations: true,
      event_occurrences: true
    }
  });
};