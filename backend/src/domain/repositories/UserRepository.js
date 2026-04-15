class UserRepository {
  async findById(id) {
    throw new Error('findById not implemented');
  }

  async findByEmail(email) {
    throw new Error('findByEmail not implemented');
  }

  async findAll() {
    throw new Error('findAll not implemented');
  }

  async save(user) {
    throw new Error('save not implemented');
  }

  async delete(id) {
    throw new Error('delete not implemented');
  }
}

module.exports = UserRepository;
