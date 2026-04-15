/**
 * Location Repository Interface
 * Defines the contract for location persistence
 */
class ILocationRepository {
  async findById(id) {
    throw new Error('findById must be implemented');
  }

  async findAll() {
    throw new Error('findAll must be implemented');
  }

  async findByCoordinates(coordinates, radiusKm = 5) {
    throw new Error('findByCoordinates must be implemented');
  }

  async findOpen(timezone = 'UTC') {
    throw new Error('findOpen must be implemented');
  }

  async save(location) {
    throw new Error('save must be implemented');
  }

  async delete(id) {
    throw new Error('delete must be implemented');
  }

  async countViews(id) {
    throw new Error('countViews must be implemented');
  }

  async recordView(id) {
    throw new Error('recordView must be implemented');
  }
}

module.exports = ILocationRepository;
