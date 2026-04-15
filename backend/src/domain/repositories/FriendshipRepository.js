class FriendshipRepository {
  async findById(id) {
    throw new Error('findById not implemented');
  }

  async findByUsers(userId1, userId2) {
    throw new Error('findByUsers not implemented');
  }

  async findPending(userId) {
    throw new Error('findPending not implemented');
  }

  async findAccepted(userId) {
    throw new Error('findAccepted not implemented');
  }

  async save(friendship) {
    throw new Error('save not implemented');
  }

  async delete(id) {
    throw new Error('delete not implemented');
  }
}

module.exports = FriendshipRepository;
