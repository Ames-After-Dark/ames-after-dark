class IFriendshipRepository {
  async findById(id) { throw new Error('Not implemented'); }
  async findByUsers(userId1, userId2) { throw new Error('Not implemented'); }
  async findPending(userId) { throw new Error('Not implemented'); }
  async findAccepted(userId) { throw new Error('Not implemented'); }
  async findAll() { throw new Error('Not implemented'); }
  async save(friendship) { throw new Error('Not implemented'); }
  async delete(id) { throw new Error('Not implemented'); }
}
module.exports = IFriendshipRepository;
