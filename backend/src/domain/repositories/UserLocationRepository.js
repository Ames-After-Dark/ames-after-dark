class UserLocationRepository {
  async findById(id) {
    throw new Error('findById not implemented');
  }

  async findByUser(userId) {
    throw new Error('findByUser not implemented');
  }

  async findByLocation(locationId) {
    throw new Error('findByLocation not implemented');
  }

  async findActiveByLocation(locationId) {
    throw new Error('findActiveByLocation not implemented');
  }

  async save(userLocation) {
    throw new Error('save not implemented');
  }

  async delete(id) {
    throw new Error('delete not implemented');
  }
}

module.exports = UserLocationRepository;
