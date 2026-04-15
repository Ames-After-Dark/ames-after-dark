const IFriendshipRepository = require('../../domain/repositories/IFriendshipRepository');
const Friendship = require('../../domain/entities/Friendship');
const prisma = require('../../db');

class PrismaFriendshipRepository extends IFriendshipRepository {
  async findById(id) {
    const raw = await prisma.friendships.findUnique({ where: { id } });
    return raw ? this.toDomain(raw) : null;
  }

  async findByUsers(userId1, userId2) {
    const raw = await prisma.friendships.findFirst({
      where: {
        OR: [
          { user_id_1: userId1, user_id_2: userId2 },
          { user_id_1: userId2, user_id_2: userId1 },
        ],
      },
    });
    return raw ? this.toDomain(raw) : null;
  }

  async findPending(userId) {
    const raw = await prisma.friendships.findMany({
      where: { user_id_2: userId, status: 'pending' },
    });
    return raw.map(r => this.toDomain(r));
  }

  async findAccepted(userId) {
    const raw = await prisma.friendships.findMany({
      where: {
        OR: [{ user_id_1: userId }, { user_id_2: userId }],
        status: 'accepted',
      },
    });
    return raw.map(r => this.toDomain(r));
  }

  async findAll() {
    const raw = await prisma.friendships.findMany();
    return raw.map(r => this.toDomain(r));
  }

  async save(friendship) {
    const exists = await prisma.friendships.findUnique({ where: { id: friendship.id } });
    const data = this.toPersistence(friendship);

    if (exists) {
      return this.toDomain(
        await prisma.friendships.update({ where: { id: friendship.id }, data })
      );
    } else {
      return this.toDomain(await prisma.friendships.create({ data }));
    }
  }

  async delete(id) {
    await prisma.friendships.delete({ where: { id } });
  }

  toDomain(raw) {
    return new Friendship(raw.id, raw.user_id_1, raw.user_id_2, {
      status: raw.status,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }

  toPersistence(domain) {
    const obj = domain.toObject();
    return {
      user_id_1: obj.userId1,
      user_id_2: obj.userId2,
      status: obj.status,
      updated_at: new Date(),
    };
  }
}

module.exports = PrismaFriendshipRepository;
