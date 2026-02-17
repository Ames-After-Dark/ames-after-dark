const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get user location by userId
async function getUserLocationByUserId(userId) {
  return prisma.user_locations.findUnique({
    where: { user_id: userId },
  });
}

// Update user location by userId
async function updateUserLocationByUserId(userId, data) {
  return prisma.user_locations.upsert({
    where: { user_id: userId },
    update: data,
    create: { user_id: userId, ...data },
  });
}

module.exports = {
  getUserLocationByUserId,
  updateUserLocationByUserId,
};
