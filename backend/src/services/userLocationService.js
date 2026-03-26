const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get user location by userId
exports.getUserLocationByUserId = async (userId) => {
  return prisma.user_locations.findUnique({
    where: { user_id: userId },
  });
}

// Update user location by userId
exports.updateUserLocationByUserId = async (userId, data) => {
  return prisma.user_locations.upsert({
    where: { user_id: userId },
    update: {
      ...data,
      updated_at: new Date(),
    },
    create: { user_id: userId, ...data },
  });
}

exports.getFriendsLocations = async (userId) => {
  const data = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      friendships_friendships_user_id_1Tousers: {
        where: { friendship_status_id: 2 },
        select: {
          users_friendships_user_id_2Tousers: {
            select: {
              id: true,
              username: true,
              name: true,
              user_locations: {
                where: {
                  users: {
                    location_permissions_location_permissions_owner_idTousers: {
                      some: { viewer_id: userId }
                    }
                  }
                }
              },
            },
          },
        },
      },
      friendships_friendships_user_id_2Tousers: {
        where: { friendship_status_id: 2 },
        select: {
          users_friendships_user_id_1Tousers: {
            select: {
              id: true,
              username: true,
              name: true,
              user_locations: {
                where: {
                  users: {
                    location_permissions_location_permissions_owner_idTousers: {
                      some: { viewer_id: userId }
                    }
                  }
                }
              },
            },
          },
        },
      },
    },
  });

  if (!data) return [];

  const friendsList1 = data.friendships_friendships_user_id_1Tousers.map(f => f.users_friendships_user_id_2Tousers);
  const friendsList2 = data.friendships_friendships_user_id_2Tousers.map(f => f.users_friendships_user_id_1Tousers);
  
  const allFriends = [...friendsList1, ...friendsList2];

  return allFriends.filter(friend => friend.user_locations !== null);
};

exports.updatePermission = async (ownerId, viewerId, shouldEnable) => {
  if (shouldEnable) {
    return await prisma.location_permissions.upsert({
      where: {
        owner_id_viewer_id: { owner_id: ownerId, viewer_id: viewerId }
      },
      update: {}, // No fields to update, just ensure it exists
      create: { owner_id: ownerId, viewer_id: viewerId }
    });
  } else {
    // deleteMany is safer than delete because it won't throw 404 if already deleted
    return await prisma.location_permissions.deleteMany({
      where: { owner_id: ownerId, viewer_id: viewerId }
    });
  }
};