class MenuItemRepository {
  async findById(id) {
    throw new Error('findById not implemented');
  }

  async findByLocation(locationId) {
    throw new Error('findByLocation not implemented');
  }

  async findByLocationAndCategory(locationId, category) {
    throw new Error('findByLocationAndCategory not implemented');
  }

  async save(menuItem) {
    throw new Error('save not implemented');
  }

  async delete(id) {
    throw new Error('delete not implemented');
  }
}

module.exports = MenuItemRepository;
