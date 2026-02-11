const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getUsers = async () => {
  return prisma.users.findMany({
    include: {
      roles: true,
      user_favorites: {
        include: {
          locations: {
            include: {
              location_types: true,
              deals: true,
              events: true,
              location_hours: {
                include: {
                  weekdays: true
                }
              }
            }
          }
        }
      },
      friendships_friendships_user_id_1Tousers: {
        include: {
          friendship_statuses: true,
          users_friendships_user_id_2Tousers: {
            include: {
              roles: true
            }
          }
        }
      },
      friendships_friendships_user_id_2Tousers: {
        include: {
          friendship_statuses: true,
          users_friendships_user_id_1Tousers: {
            include: {
              roles: true
            }
          }
        }
      }
    },
    orderBy: { id: 'asc' },
  });
};

exports.getUserById = async (id) => {
  return prisma.users.findUnique({
    where: { id: Number(id) },
    include: {
      roles: true,
      user_favorites: {
        include: {
          locations: {
            include: {
              location_types: true,
              deals: true,
              events: true,
              location_hours: {
                include: {
                  weekdays: true
                }
              }
            }
          }
        }
      },
      friendships_friendships_user_id_1Tousers: {
        include: {
          friendship_statuses: true,
          users_friendships_user_id_2Tousers: {
            include: {
              roles: true
            }
          }
        }
      },
      friendships_friendships_user_id_2Tousers: {
        include: {
          friendship_statuses: true,
          users_friendships_user_id_1Tousers: {
            include: {
              roles: true
            }
          }
        }
      }
    }
  });
};

exports.createUser = async (userData) => {
  return prisma.users.create({
    data: {
      ...userData,
      role_id: userData.role_id ? Number(userData.role_id) : null,
    },
    include: {
      roles: true,
      user_favorites: true
    }
  });
};

exports.updateUser = async (id, userData) => {
  return prisma.users.update({
    where: { id: Number(id) },
    data: {
      ...userData,
      role_id: userData.role_id ? Number(userData.role_id) : undefined,
    },
    include: {
      roles: true,
      user_favorites: true
    }
  });
};

exports.deleteUser = async (id) => {
  return prisma.users.delete({
    where: { id: Number(id) }
  });
};

exports.getUserFriends = async (userId) => {
  // Find all friendships where the user is either user_id_1 or user_id_2 and status is "accepted" (if you have such a status)
  const friendships = await prisma.friendships.findMany({
    where: {
      OR: [
        { user_id_1: Number(userId) },
        { user_id_2: Number(userId) }
      ],
      // Optionally filter by accepted status:
      // friendship_status_id: 2 // if 2 means "accepted"
    },
    include: {
      users_friendships_user_id_1Tousers: true,
      users_friendships_user_id_2Tousers: true
    }
  });

  // Map to return the friend user object (not the user themselves)
  return friendships.map(f => {
    if (f.user_id_1 === Number(userId)) {
      return f.users_friendships_user_id_2Tousers;
    } else {
      return f.users_friendships_user_id_1Tousers;
    }
  });
};

// TEMP_AUTH_START - Remove when re-enabling Auth0
exports.loginUser = async (username) => {
  // Simple login: just check if user exists by username
  const user = await prisma.users.findFirst({
    where: { username: username },
    include: {
      roles: true
    }
  });
  return user;
};
// TEMP_AUTH_END