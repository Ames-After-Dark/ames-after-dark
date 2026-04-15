/**
 * User Repository Interface
 * Defines the contract for user persistence
 */
class IUserRepository {
  async findById(id) {
    throw new Error('findById must be implemented');
  }

  async findByUid(uid) {
    throw new Error('findByUid must be implemented');
  }

  async findByEmail(email) {
    throw new Error('findByEmail must be implemented');
  }

  async findByUsername(username) {
    throw new Error('findByUsername must be implemented');
  }

  async findAll() {
    throw new Error('findAll must be implemented');
  }

  async search(query) {
    throw new Error('search must be implemented');
  }

  async save(user) {
    throw new Error('save must be implemented');
  }

  async delete(id) {
    throw new Error('delete must be implemented');
  }

  async addFavoriteLocation(userId, locationId) {
    throw new Error('addFavoriteLocation must be implemented');
  }

  async removeFavoriteLocation(userId, locationId) {
    throw new Error('removeFavoriteLocation must be implemented');
  }

  async getFavoriteLocations(userId) {
    throw new Error('getFavoriteLocations must be implemented');
  }
}

module.exports = IUserRepository;
