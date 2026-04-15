class EventRepository {
  async findById(id) {
    throw new Error('findById not implemented');
  }

  async findByLocation(locationId) {
    throw new Error('findByLocation not implemented');
  }

  async findUpcoming(limit) {
    throw new Error('findUpcoming not implemented');
  }

  async save(event) {
    throw new Error('save not implemented');
  }

  async delete(id) {
    throw new Error('delete not implemented');
  }
}

module.exports = EventRepository;
