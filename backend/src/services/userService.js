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

// Only allow updating username, email, and bio
exports.updateUserLimited = async (id, updateData) => {
  // Only pick allowed fields
  const allowedFields = {};
  if (updateData.username !== undefined) allowedFields.username = updateData.username;
  if (updateData.email !== undefined) allowedFields.email = updateData.email;
  if (updateData.bio !== undefined) allowedFields.bio = updateData.bio;

  return prisma.users.update({
    where: { id: Number(id) },
    data: allowedFields,
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


/**
 * Get user by Auth0 UID (subject from JWT)
 * @param {string} auth0Id - The Auth0 user ID (sub claim from JWT)
 * @returns {Promise<Object|null>} User object or null if not found
 */
exports.getUserByAuth0Id = async (auth0Id) => {
  return prisma.users.findUnique({
    where: { uid: auth0Id },
    include: {
      roles: true
    }
  });
};

/**
 * Create a new user with Auth0 credentials and registration data
 * @param {Object} userData - User registration data
 * @param {string} userData.auth0Id - The Auth0 user ID (sub claim)
 * @param {string} userData.phoneNumber - User's phone number
 * @param {string|Date} userData.birthday - User's birthday
 * @param {string} [userData.email] - User's email (optional, from Auth0)
 * @param {string} [userData.name] - User's name (optional, from Auth0)
 * @returns {Promise<Object>} Created user object
 */
exports.createUserWithAuth0 = async (userData) => {
  const { auth0Id, phoneNumber, birthday, email, name } = userData;
  
  return prisma.users.create({
    data: {
      uid: auth0Id,
      phone_number: phoneNumber,
      birthday: new Date(birthday),
      email: email || null,
      name: name || null,
      // Set default role_id if needed, or leave as null for regular users
      role_id: null
    },
    include: {
      roles: true
    }
  });
};