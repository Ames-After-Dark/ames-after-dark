class UserFavoriteRepository {
  async findById(id) {
    throw new Error('findById not implemented');
  }

  async findByUser(userId) {
    throw new Error('findByUser not implemented');
  }

  async findByLocation(locationId) {
    throw new Error('findByLocation not implemented');
  }

  async findByUserAndLocation(userId, locationId) {
    throw new Error('findByUserAndLocation not implemented');
  }

  async save(userFavorite) {
    throw new Error('save not implemented');
  }

  async delete(id) {
    throw new Error('delete not implemented');
  }
}

module.exports = UserFavoriteRepository;
