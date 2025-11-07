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