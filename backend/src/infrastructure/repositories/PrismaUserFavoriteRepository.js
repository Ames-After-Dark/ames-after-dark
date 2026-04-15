const UserFavoriteRepository = require('../../domain/repositories/UserFavoriteRepository');
const UserFavorite = require('../../domain/entities/UserFavorite');

class PrismaUserFavoriteRepository extends UserFavoriteRepository {
  constructor(prismaClient) {
    super();
    this.prismaClient = prismaClient;
  }

  async findById(id) {
    const data = await this.prismaClient.userFavorite.findUnique({ where: { id } });
    return data ? this._toDomain(data) : null;
  }

  async findByUser(userId) {
    const data = await this.prismaClient.userFavorite.findMany({
      where: { userId },
    });
    return data.map(uf => this._toDomain(uf));
  }

  async findByLocation(locationId) {
    const data = await this.prismaClient.userFavorite.findMany({
      where: { locationId },
    });
    return data.map(uf => this._toDomain(uf));
  }

  async findByUserAndLocation(userId, locationId) {
    const data = await this.prismaClient.userFavorite.findUnique({
      where: { userId_locationId: { userId, locationId } },
    });
    return data ? this._toDomain(data) : null;
  }

  async save(userFavorite) {
    const data = {
      userId: userFavorite.userId,
      locationId: userFavorite.locationId,
    };

    let saved;
    if (userFavorite.id) {
      saved = await this.prismaClient.userFavorite.update({
        where: { id: userFavorite.id },
        data,
      });
    } else {
      saved = await this.prismaClient.userFavorite.create({ data });
    }

    return this._toDomain(saved);
  }

  async delete(id) {
    await this.prismaClient.userFavorite.delete({ where: { id } });
  }

  _toDomain(data) {
    return new UserFavorite(
      data.id,
      data.userId,
      data.locationId,
      data.createdAt
    );
  }
}

module.exports = PrismaUserFavoriteRepository;
