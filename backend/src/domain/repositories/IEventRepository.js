class IEventRepository {
  async findById(id) {
    throw new Error('Not implemented');
  }

  async findByLocationId(locationId) {
    throw new Error('Not implemented');
  }

  async findUpcoming(days = 7) {
    throw new Error('Not implemented');
  }

  async findAll() {
    throw new Error('Not implemented');
  }

  async save(event) {
    throw new Error('Not implemented');
  }

  async delete(id) {
    throw new Error('Not implemented');
  }
}

module.exports = IEventRepository;
