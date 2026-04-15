class LocationRepository {
  async findById(id) {
    throw new Error('findById not implemented');
  }

  async findAll() {
    throw new Error('findAll not implemented');
  }

  async findByCity(city) {
    throw new Error('findByCity not implemented');
  }

  async findNearby(latitude, longitude, radiusKm) {
    throw new Error('findNearby not implemented');
  }

  async save(location) {
    throw new Error('save not implemented');
  }

  async delete(id) {
    throw new Error('delete not implemented');
  }
}

module.exports = LocationRepository;
