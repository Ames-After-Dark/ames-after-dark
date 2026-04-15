class IUserLocationRepository {
  async findById(id) { throw new Error('Not implemented'); }
  async findByUserId(userId) { throw new Error('Not implemented'); }
  async findRecent(userId, limit) { throw new Error('Not implemented'); }
  async save(userLocation) { throw new Error('Not implemented'); }
  async delete(id) { throw new Error('Not implemented'); }
}
module.exports = IUserLocationRepository;
