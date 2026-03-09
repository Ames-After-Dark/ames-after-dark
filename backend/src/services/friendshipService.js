const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const STATUS_PENDING = 1;
const STATUS_ACCEPTED = 2;
const STATUS_DECLINED = 3;
const STATUS_BLOCKED = 4;

function getOrderedIds(a, b) {
  return a < b ? [a, b] : [b, a];
}

exports.getFriends = async (userId) => {
  // Return all accepted friends for user
  const friendships = await prisma.friendships.findMany({
    where: {
      OR: [
        { user_id_1: userId },
        { user_id_2: userId }
      ],
      friendship_status_id: STATUS_ACCEPTED
    },
    include: {
      users_friendships_user_id_1Tousers: true,
      users_friendships_user_id_2Tousers: true
    }
  });
  return friendships.map(f =>
    f.user_id_1 === userId ? f.users_friendships_user_id_2Tousers : f.users_friendships_user_id_1Tousers
  );
};

exports.sendFriendRequest = async (userId, friendId) => {
  const [id1, id2] = getOrderedIds(userId, friendId);
  // Only allow if not already friends or pending
  const existing = await prisma.friendships.findUnique({
    where: { user_id_1_user_id_2: { user_id_1: id1, user_id_2: id2 } }
  });
  if (existing) throw new Error('Friendship already exists or pending');
  return prisma.friendships.create({
    data: {
      user_id_1: id1,
      user_id_2: id2,
      friendship_status_id: STATUS_PENDING
    }
  });
};

exports.acceptFriendRequest = async (userId, friendId) => {
  const [id1, id2] = getOrderedIds(userId, friendId);
  return prisma.friendships.update({
    where: { user_id_1_user_id_2: { user_id_1: id1, user_id_2: id2 } },
    data: { friendship_status_id: STATUS_ACCEPTED }
  });
};

exports.declineFriendRequest = async (userId, friendId) => {
  const [id1, id2] = getOrderedIds(userId, friendId);
  return prisma.friendships.update({
    where: { user_id_1_user_id_2: { user_id_1: id1, user_id_2: id2 } },
    data: { friendship_status_id: STATUS_DECLINED }
  });
};

exports.removeFriend = async (userId, friendId) => {
  const [id1, id2] = getOrderedIds(userId, friendId);
  return prisma.friendships.delete({
    where: { user_id_1_user_id_2: { user_id_1: id1, user_id_2: id2 } }
  });
};

exports.getPendingRequests = async (userId) => {
  // Requests where user is the recipient and status is pending
  return prisma.friendships.findMany({
    where: {
      OR: [
        { user_id_1: userId },
        { user_id_2: userId }
      ],
      friendship_status_id: STATUS_PENDING
    },
    include: {
      users_friendships_user_id_1Tousers: true,
      users_friendships_user_id_2Tousers: true
    }
  });
};

exports.blockFriend = async (userId, friendId) => {
  const [id1, id2] = getOrderedIds(userId, friendId);
  return prisma.friendships.update({
    where: { user_id_1_user_id_2: { user_id_1: id1, user_id_2: id2 } },
    data: { friendship_status_id: STATUS_BLOCKED }
  });
};

exports.getFriendLocations = async (userId) => {
  const friendships = await prisma.friendships.findMany({
    where: {
      OR: [
        { user_id_1: userId },
        { user_id_2: userId }
      ],
      friendship_status_id: STATUS_ACCEPTED
    },
    include: {
      users_friendships_user_id_1Tousers: {
        select: {
          id: true,
          username: true,
          name: true,
          user_locations: {
            select: {
              latitude: true,
              longitude: true,
              updated_at: true
            }
          }
        }
      },
      users_friendships_user_id_2Tousers: {
        select: {
          id: true,
          username: true,
          name: true,
          user_locations: {
            select: {
              latitude: true,
              longitude: true,
              updated_at: true
            }
          }
        }
      }
    }
  });

  return friendships
    .map((friendship) => {
      const friend = friendship.user_id_1 === userId
        ? friendship.users_friendships_user_id_2Tousers
        : friendship.users_friendships_user_id_1Tousers;

      if (!friend?.user_locations) {
        return null;
      }

      return {
        id: friend.id,
        name: friend.username || friend.name || `User ${friend.id}`,
        latitude: Number.parseFloat(friend.user_locations.latitude.toString()),
        longitude: Number.parseFloat(friend.user_locations.longitude.toString()),
        updatedAt: friend.user_locations.updated_at,
      };
    })
    .filter((friendLocation) => friendLocation !== null);
};

