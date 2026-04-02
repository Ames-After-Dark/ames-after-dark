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
  const now = new Date();

  const data = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      // Logic for friends where you are user_id_1
      friendships_friendships_user_id_1Tousers: {
        where: { friendship_status_id: 2 },
        select: {
          users_friendships_user_id_2Tousers: {
            select: {
              id: true,
              username: true,
              name: true,
              user_settings: true,
              user_locations: true,
              // We fetch the permission record if it exists
              location_permissions_location_permissions_owner_idTousers: {
                where: { viewer_id: userId }
              }
            }
          }
        }
      },
      // Logic for friends where you are user_id_2
      friendships_friendships_user_id_2Tousers: {
        where: { friendship_status_id: 2 },
        select: {
          users_friendships_user_id_1Tousers: {
            select: {
              id: true,
              username: true,
              name: true,
              user_settings: true,
              user_locations: true,
              location_permissions_location_permissions_owner_idTousers: {
                where: { viewer_id: userId }
              }
            }
          }
        }
      }
    }
  });

  if (!data) return [];

  const allFriends = [
    ...data.friendships_friendships_user_id_1Tousers.map(f => f.users_friendships_user_id_2Tousers),
    ...data.friendships_friendships_user_id_2Tousers.map(f => f.users_friendships_user_id_1Tousers)
  ];

  return allFriends.filter(friend => {
    const settings = friend.user_settings;
    const location = friend.user_locations;
    const hasExplicitPermission = friend.location_permissions_location_permissions_owner_idTousers.length > 0;

    if (!location) return false;

    if (settings?.ghost_mode_expires_at && new Date(settings.ghost_mode_expires_at) > now) {
      return false;
    }

    const pref = settings?.location_sharing_preference || 'SELECTIVE';

    if (pref === 'PRIVATE') return false;
    if (pref === 'PUBLIC') return true;
    if (pref === 'SELECTIVE') return hasExplicitPermission;

    return false;
  }).map(friend => ({
    id: friend.id,
    username: friend.username,
    name: friend.name,
    location: friend.user_locations
  }));
};

exports.updatePermission = async (ownerId, viewerId, shouldEnable) => {
  if (shouldEnable) {
    return await prisma.user_location_permissions.upsert({
      where: {
        owner_id_viewer_id: { owner_id: ownerId, viewer_id: viewerId }
      },
      update: {}, // No fields to update, just ensure it exists
      create: { owner_id: ownerId, viewer_id: viewerId }
    });
  } else {
    // deleteMany is safer than delete because it won't throw 404 if already deleted
    return await prisma.user_location_permissions.deleteMany({
      where: { owner_id: ownerId, viewer_id: viewerId }
    });
  }
};

exports.setGhostMode = async (userId, hours) => {
  let expiry = null;
  
  if (hours > 0) {
    expiry = new Date();
    expiry.setHours(expiry.getHours() + hours);
  }

  return await prisma.user_settings.update({
    where: { user_id: userId },
    data: { ghost_mode_expires_at: expiry }
  });
};

exports.updateSharingPreference = async (userId, preference) => {
  // preference must be 'PUBLIC', 'PRIVATE', or 'SELECTIVE'
  return await prisma.user_settings.update({
    where: { user_id: userId },
    data: { location_sharing_preference: preference }
  });
};