const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDeals = async () => {
  return prisma.deals.findMany({
    orderBy: { id: 'asc' },
    include: {
      locations: true,
      deal_occurrences: true
    }
  });
};

exports.getDealById = async (id) => {
  return prisma.deals.findUnique({
    where: { id: Number(id) },
    include: {
      locations: true,
      deal_occurrences: true
    }
  });
};

exports.createDeal = async (dealData) => {
  const { occurrences, ...rest } = dealData;

  return prisma.deals.create({
    data: {
      ...rest,
      location_id: dealData.location_id ? Number(dealData.location_id) : null,
      deal_occurrences: occurrences && occurrences.length > 0
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
      deal_occurrences: true
    }
  });
};

exports.updateDeal = async (id, dealData) => {
  const { occurrences, ...rest } = dealData;

  return prisma.deals.update({
    where: { id: Number(id) },
    data: {
      ...rest,
      location_id: dealData.location_id ? Number(dealData.location_id) : undefined,
      deal_occurrences: occurrences && occurrences.length > 0
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
      deal_occurrences: true
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

  return prisma.deal_occurrences.findMany({
    where: {
      start_time_utc: { lte: now },
      end_time_utc: { gte: now }
    },
    include: {
      deals: {
        include: {
          locations: true
        }
      }
    }
  });
};

exports.getDealsByLocationId = async (locationId) => {
  return prisma.deals.findMany({
    where: { location_id: Number(locationId) },
    include: {
      deal_occurrences: true,
      locations: true
    }
  });
};

exports.createRecurringDeal = async (dealData) => {
  const { name, location_id, start_time, end_time, start_date, end_date, weekdays } = dealData;

  // Create the deal template first
  const deal = await prisma.deals.create({
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
        deal_id: deal.id,
        start_time_utc: occurrenceStart,
        end_time_utc: occurrenceEnd
      });
    }
  }

  // Insert occurrences in bulk
  await prisma.deal_occurrences.createMany({
    data: occurrences
  });

  return {
    deal,
    occurrences
  };
};

exports.searchDeals = async (searchParams) => {
  const { id, startDateTime, endDateTime, locationId } = searchParams;

  // Build the where clause for deal_occurrences
  const occurrenceWhere = {};
  if (startDateTime) {
    occurrenceWhere.start_time_utc = { gte: new Date(startDateTime) };
  }
  if (endDateTime) {
    occurrenceWhere.end_time_utc = { lte: new Date(endDateTime) };
  }

  // If we have date filters, search through occurrences to get deals
  if (startDateTime || endDateTime) {
    let occurrences = await prisma.deal_occurrences.findMany({
      where: occurrenceWhere,
      include: {
        deals: {
          include: {
            locations: true
          }
        }
      }
    });

    if (locationId) {
      // Filter occurrences by locationId
      occurrences = occurrences.filter(o => o.deals.location_id === Number(locationId));
    }

    // If id is specified, filter occurrences by deal id
    if (id) {
      return occurrences.filter(o => o.deals.id === Number(id));
    }

    // Remove duplicates and return deals
    const dealsMap = new Map();
    occurrences.forEach(o => {
      const deal = { ...o.deals, deal_occurrences: [] };
      if (!dealsMap.has(deal.id)) {
        dealsMap.set(deal.id, deal);
      }
      dealsMap.get(deal.id).deal_occurrences.push({
        id: o.id,
        deal_id: o.deal_id,
        start_time_utc: o.start_time_utc,
        end_time_utc: o.end_time_utc
      });
    });

    return Array.from(dealsMap.values());
  }

  // If only id is specified
  if (id) {
    const deal = await prisma.deals.findUnique({
      where: { id: Number(id) },
      include: {
        locations: true,
        deal_occurrences: true
      }
    });
    return deal ? [deal] : [];
  }

  // No filters - return all deals
  return prisma.deals.findMany({
    orderBy: { id: 'asc' },
    include: {
      locations: true,
      deal_occurrences: true
    }
  });
};