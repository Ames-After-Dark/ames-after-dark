const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const STATUS_PENDING = 1;
const STATUS_ACCEPTED = 2;
const STATUS_DECLINED = 3;
const STATUS_BLOCKED = 4;

function getOrderedIds(a, b) {
  return a < b ? [a, b] : [b, a];
}

exports.isBlocked = async (userId, targetUserId) => {
  const friendship = await prisma.friendships.findFirst({
    where: {
      OR: [
        { user_id_1: userId, user_id_2: targetUserId },
        { user_id_1: targetUserId, user_id_2: userId }
      ],
      friendship_status_id: STATUS_BLOCKED
    }
  });
  return !!friendship;
};

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
      users_friendships_user_id_1Tousers: {
        select: {
          id: true,
          name: true,
          username: true,
          profile_photo_id: true,
          profile_photo: true,
          bio: true
        }
      },
      users_friendships_user_id_2Tousers: {
        select: {
          id: true,
          name: true,
          username: true,
          profile_photo_id: true,
          profile_photo: true,
          bio: true
        }
      }
    }
  });
  return friendships.map(f =>
    f.user_id_1 === userId ? f.users_friendships_user_id_2Tousers : f.users_friendships_user_id_1Tousers
  );
};

exports.getFriendsOfFriend = async (userId, friendId) => {
  // Confirm the target user is an accepted friend first
  const friendship = await prisma.friendships.findFirst({
    where: {
      OR: [
        { user_id_1: userId, user_id_2: friendId },
        { user_id_1: friendId, user_id_2: userId }
      ],
      friendship_status_id: STATUS_ACCEPTED
    }
  });

  if (!friendship) {
    throw new Error('Not friends');
  }

  const friendFriendships = await prisma.friendships.findMany({
    where: {
      OR: [
        { user_id_1: friendId },
        { user_id_2: friendId }
      ],
      friendship_status_id: STATUS_ACCEPTED
    },
    include: {
      users_friendships_user_id_1Tousers: {
        select: {
          id: true,
          name: true,
          username: true,
          profile_photo_id: true,
          profile_photo: true,
          bio: true
        }
      },
      users_friendships_user_id_2Tousers: {
        select: {
          id: true,
          name: true,
          username: true,
          profile_photo_id: true,
          profile_photo: true,
          bio: true
        }
      }
    }
  });

  const friendCandidates = friendFriendships
    .map(f =>
      f.user_id_1 === friendId
        ? f.users_friendships_user_id_2Tousers
        : f.users_friendships_user_id_1Tousers
    );

  if (friendCandidates.length === 0) {
    return [];
  }

  const candidateIds = friendCandidates.map(candidate => candidate.id);

  const blockedRelations = await prisma.friendships.findMany({
    where: {
      OR: [
        { user_id_1: userId, user_id_2: { in: candidateIds } },
        { user_id_2: userId, user_id_1: { in: candidateIds } }
      ],
      friendship_status_id: STATUS_BLOCKED
    },
    select: {
      user_id_1: true,
      user_id_2: true
    }
  });

  const blockedIds = new Set(
    blockedRelations.map(block =>
      block.user_id_1 === userId ? block.user_id_2 : block.user_id_1
    )
  );

  return friendCandidates.filter(candidate => !blockedIds.has(candidate.id));
};

exports.sendFriendRequest = async (userId, friendId) => {
  const [id1, id2] = getOrderedIds(userId, friendId);
  // Only allow if not already friends or pending
  const existing = await prisma.friendships.findUnique({
    where: { user_id_1_user_id_2: { user_id_1: id1, user_id_2: id2 } }
  });
  if (existing) throw new Error('Friendship already exists or pending');

  // Store with userId as user_id_1 and friendId as user_id_2 to track who sent the request
  // This means user_id_1 = sender, user_id_2 = receiver (NOT ordered by ID)
  return prisma.friendships.create({
    data: {
      user_id_1: userId,
      user_id_2: friendId,
      friendship_status_id: STATUS_PENDING
    }
  });
};

exports.acceptFriendRequest = async (userId, friendId) => {
  // Try to find the friendship record (could be in either order)
  const friendship = await prisma.friendships.findFirst({
    where: {
      OR: [
        { user_id_1: userId, user_id_2: friendId },
        { user_id_1: friendId, user_id_2: userId }
      ],
      friendship_status_id: STATUS_PENDING
    }
  });

  if (!friendship) throw new Error('Friendship request not found');

  return prisma.friendships.update({
    where: {
      user_id_1_user_id_2: {
        user_id_1: friendship.user_id_1,
        user_id_2: friendship.user_id_2
      }
    },
    data: { friendship_status_id: STATUS_ACCEPTED }
  });
};

exports.declineFriendRequest = async (userId, friendId) => {
  // Try to find the friendship record (could be in either order)
  const friendship = await prisma.friendships.findFirst({
    where: {
      OR: [
        { user_id_1: userId, user_id_2: friendId },
        { user_id_1: friendId, user_id_2: userId }
      ],
      friendship_status_id: STATUS_PENDING
    }
  });

  if (!friendship) throw new Error('Friendship request not found');

  return prisma.friendships.update({
    where: {
      user_id_1_user_id_2: {
        user_id_1: friendship.user_id_1,
        user_id_2: friendship.user_id_2
      }
    },
    data: { friendship_status_id: STATUS_DECLINED }
  });
};

exports.removeFriend = async (userId, friendId) => {
  // Try to find the friendship record (could be in either order)
  const friendship = await prisma.friendships.findFirst({
    where: {
      OR: [
        { user_id_1: userId, user_id_2: friendId },
        { user_id_1: friendId, user_id_2: userId }
      ]
    }
  });

  if (!friendship) throw new Error('Friendship not found');

  return prisma.$transaction(async (tx) => {
    // 1. Delete the friendship
    const deletedFriendship = await tx.friendships.delete({
      where: {
        user_id_1_user_id_2: {
          user_id_1: friendship.user_id_1,
          user_id_2: friendship.user_id_2
        }
      }
    });

    // 2. Also remove any selective location permissions referencing these two users
    await tx.user_location_permissions.deleteMany({
      where: {
        OR: [
          { owner_id: userId, viewer_id: friendId },
          { owner_id: friendId, viewer_id: userId }
        ]
      }
    });

    return deletedFriendship;
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
  // Try to find the friendship record (could be in either order)
  const friendship = await prisma.friendships.findFirst({
    where: {
      OR: [
        { user_id_1: userId, user_id_2: friendId },
        { user_id_1: friendId, user_id_2: userId }
      ]
    }
  });

  return prisma.$transaction(async (tx) => {
    // 1. Remove any selective location permissions referencing these two users
    await tx.user_location_permissions.deleteMany({
      where: {
        OR: [
          { owner_id: userId, viewer_id: friendId },
          { owner_id: friendId, viewer_id: userId }
        ]
      }
    });

    if (!friendship) {
      // If no friendship exists, create one with blocked status
      return tx.friendships.create({
        data: {
          user_id_1: userId,
          user_id_2: friendId,
          friendship_status_id: STATUS_BLOCKED
        }
      });
    }

    return tx.friendships.update({
      where: {
        user_id_1_user_id_2: {
          user_id_1: friendship.user_id_1,
          user_id_2: friendship.user_id_2
        }
      },
      data: { friendship_status_id: STATUS_BLOCKED }
    });
  });
};

// Simple recommendation: Return first N users who aren't friends (for users with no/few friends)
const getSimpleRecommendations = async (userId, limit, excludedIds) => {
  const users = await prisma.users.findMany({
    where: {
      id: { notIn: excludedIds },
    },
    select: {
      id: true,
      username: true,
      name: true,
      profile_photo: true,
      bio: true,
    },
    take: limit,
  });

  return users.map(user => ({
    user,
    mutualCount: 0,
  }));
};

// Advanced recommendation: Friends-of-friends algorithm (for users with established networks)
const getFriendsOfFriendsRecommendations = async (userId, limit, currentFriendIds) => {
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
        select: { id: true, username: true, name: true, profile_photo: true, bio: true },
      },
      users_friendships_user_id_2Tousers: {
        select: { id: true, username: true, name: true, profile_photo: true, bio: true },
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

exports.getRecommendedFriends = async (userId, limit = 10) => {
  // 1. Get IDs of the user's current accepted friends
  const userFriendships = await prisma.friendships.findMany({
    where: {
      OR: [{ user_id_1: userId }, { user_id_2: userId }],
    },
    select: {
      user_id_1: true,
      user_id_2: true,
      friendship_status_id: true,
    },
  });

  const acceptedFriendships = userFriendships.filter(f => f.friendship_status_id === STATUS_ACCEPTED);
  const currentFriendIds = acceptedFriendships.map((f) =>
    f.user_id_1 === userId ? f.user_id_2 : f.user_id_1
  );

  // Get all excluded IDs (friends + pending + self)
  const excludedIds = userFriendships.map((f) =>
    f.user_id_1 === userId ? f.user_id_2 : f.user_id_1
  );
  excludedIds.push(userId);

  // If user has no accepted friends, use simple recommendations
  if (currentFriendIds.length === 0) {
    return await getSimpleRecommendations(userId, limit, excludedIds);
  }

  // Otherwise, use friends-of-friends algorithm
  const recommendations = await getFriendsOfFriendsRecommendations(userId, limit, currentFriendIds);

  // If friends-of-friends returns nothing, fall back to simple recommendations
  if (recommendations.length === 0) {
    const simpleRecs = await getSimpleRecommendations(userId, limit, excludedIds);
    // Filter out blocked users from simple recommendations
    const filteredSimpleRecs = [];
    for (const rec of simpleRecs) {
      const isUserBlocked = await exports.isBlocked(userId, rec.user.id);
      if (!isUserBlocked) {
        filteredSimpleRecs.push(rec);
      }
    }
    return filteredSimpleRecs.slice(0, limit);
  }

  // Filter out blocked users from friends-of-friends recommendations
  const filteredRecommendations = [];
  for (const rec of recommendations) {
    const isUserBlocked = await exports.isBlocked(userId, rec.user.id);
    if (!isUserBlocked) {
      filteredRecommendations.push(rec);
    }
  }

  return filteredRecommendations;
};