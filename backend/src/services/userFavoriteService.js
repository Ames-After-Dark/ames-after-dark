const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getUserFavoritesByUserId = async (userId) => {
  return await prisma.user_favorites.findMany({
    where: { user_id: userId },
    select: {
      location_id: true,
      favorited_at: true
    },
    orderBy: { favorited_at: 'desc' }
  });
};

exports.toggleFavorite = async (userId, locationId) => {
  const compositeKey = {
    user_id_location_id: {
      user_id: userId,
      location_id: locationId
    }
  };

  const existing = await prisma.user_favorites.findUnique({
    where: compositeKey
  });

  if (existing) {
    await prisma.user_favorites.delete({
      where: compositeKey
    });
    return { favorited: false };
  }

  await prisma.user_favorites.create({
    data: {
      user_id: userId,
      location_id: locationId
    }
  });
  return { favorited: true };
};