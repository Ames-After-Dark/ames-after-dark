class DealRepository {
  async findById(id) {
    throw new Error('findById not implemented');
  }

  async findByLocation(locationId) {
    throw new Error('findByLocation not implemented');
  }

  async findActiveByLocation(locationId) {
    throw new Error('findActiveByLocation not implemented');
  }

  async findAllActive() {
    throw new Error('findAllActive not implemented');
  }

  async save(deal) {
    throw new Error('save not implemented');
  }

  async delete(id) {
    throw new Error('delete not implemented');
  }
}

module.exports = DealRepository;
