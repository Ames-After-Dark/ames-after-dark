const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getUsers = async () => {
  return prisma.users.findMany({
    orderBy: { id: 'asc' },
  });
};

exports.getUserById = async (id) => {
  return prisma.users.findUnique({
    where: { id: Number(id) },
  });
};