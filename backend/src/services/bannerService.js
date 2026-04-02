const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


exports.getBannerById = async (id) => {
  return prisma.banners.findUnique({
    where: { id: Number(id) },
    include: {
      deals: { select: { id: true } },
      events: { select: { id: true } }
    }
  });
};

exports.getActiveBanners = async () => {
  const now = new Date();

  const banners = await prisma.banners.findMany({
    include: {
      deals: {
        where: {
          deal_occurrences: {
            some: {
              start_time_utc: { lte: now },
              end_time_utc: { gte: now }
            }
          }
        }
      },
      events: {
        where: {
          event_occurrences: {
            some: {
              start_time_utc: { lte: now },
              end_time_utc: { gte: now }
            }
          }
        }
      }
    }
  });

  // Transform the data so the frontend knows exactly where to navigate
  return banners.map(banner => {
    // Determine the primary target (priority to events, then deals)
    const activeEvent = banner.events[0];
    const activeDeal = banner.deals[0];

    return {
      id: banner.id,
      name: banner.name,
      image_url: banner.image_url,
      // Helper fields for frontend navigation
      target_type: activeEvent ? 'EVENT' : (activeDeal ? 'DEAL' : 'NONE'),
      target_id: activeEvent?.id || activeDeal?.id || null
    };
  }).filter(b => b.target_type !== 'NONE'); // Only return banners that actually have something active
};