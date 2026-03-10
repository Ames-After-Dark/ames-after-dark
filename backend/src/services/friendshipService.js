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

exports.getFriendsLocations = async (userId) => {
  return prisma.users.findUnique({
    where: { id: userId },
    select: {
      // 1. Get friends where current user is user_id_1
      friendships_friendships_user_id_1Tousers: {
        where: { friendship_status_id: 2 }, // Assuming 2 = 'Accepted'
        select: {
          users_friendships_user_id_2Tousers: {
            select: {
              id: true,
              username: true,
              user_locations: true, // This contains lat/long
            },
          },
        },
      },
      // 2. Get friends where current user is user_id_2
      friendships_friendships_user_id_2Tousers: {
        where: { friendship_status_id: 2 },
        select: {
          users_friendships_user_id_1Tousers: {
            select: {
              id: true,
              username: true,
              user_locations: true, // This contains lat/long
            },
          },
        },
      },
    },
  });
};

exports.getRecommendedFriends = async (userId, limit = 10) => { // Added limit here
    // 1. Get IDs of the user's current accepted friends
    const userFriendships = await prisma.friendships.findMany({
        where: {
            OR: [{ user_id_1: userId }, { user_id_2: userId }],
            friendship_status_id: 2, 
        },
        select: { user_id_1: true, user_id_2: true },
    });

    const currentFriendIds = userFriendships.map((f) =>
        f.user_id_1 === userId ? f.user_id_2 : f.user_id_1
    );

    // 2. Find friendships held by those friends
    const friendsOfFriends = await prisma.friendships.findMany({
        where: {
            OR: [
                { user_id_1: { in: currentFriendIds } },
                { user_id_2: { in: currentFriendIds } },
            ],
            AND: [
                { user_id_1: { not: userId, notIn: currentFriendIds } },
                { user_id_2: { not: userId, notIn: currentFriendIds } },
            ],
            friendship_status_id: 2,
        },
        include: {
            users_friendships_user_id_1Tousers: {
                select: { id: true, username: true, profile_photo: true, bio: true },
            },
            users_friendships_user_id_2Tousers: {
                select: { id: true, username: true, profile_photo: true, bio: true },
            },
        },
    });

    // 3. Aggregate and count mutual friends
    const recommendationMap = new Map();

    friendsOfFriends.forEach((f) => {
        // Logic check: Is user_id_1 the 'friend' we already know? 
        // If yes, user_id_2 is the stranger (the recommendation).
        const potentialFriend = currentFriendIds.includes(f.user_id_1)
            ? f.users_friendships_user_id_2Tousers
            : f.users_friendships_user_id_1Tousers;

        // Safety check to ensure the join returned a user
        if (potentialFriend && potentialFriend.id !== userId) {
            const existing = recommendationMap.get(potentialFriend.id);
            if (existing) {
                existing.mutualCount += 1;
            } else {
                recommendationMap.set(potentialFriend.id, {
                    user: potentialFriend,
                    mutualCount: 1,
                });
            }
        }
    });

    // 4. Sort and return
    return Array.from(recommendationMap.values())
        .sort((a, b) => b.mutualCount - a.mutualCount)
        .slice(0, limit);
};