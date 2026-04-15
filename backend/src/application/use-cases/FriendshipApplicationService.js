const Friendship = require('../../domain/entities/Friendship');
const { FriendshipResponseDTO } = require('../dtos/FriendshipDTO');

class FriendshipApplicationService {
  constructor(friendshipRepository, eventPublisher) {
    this.friendshipRepository = friendshipRepository;
    this.eventPublisher = eventPublisher;
  }

  async getFriendship(id) {
    const friendship = await this.friendshipRepository.findById(id);
    if (!friendship) throw new Error(`Friendship ${id} not found`);
    return FriendshipResponseDTO.fromDomain(friendship);
  }

  async getPendingRequests(userId) {
    const friendships = await this.friendshipRepository.findPending(userId);
    return friendships.map(f => FriendshipResponseDTO.fromDomain(f));
  }

  async getFriends(userId) {
    const friendships = await this.friendshipRepository.findAccepted(userId);
    return friendships.map(f => FriendshipResponseDTO.fromDomain(f));
  }

  async requestFriendship(userId1, userId2) {
    const dto = { userId1, userId2 };
    if (!userId1 || !userId2) throw new Error('Both user IDs are required');
    if (userId1 === userId2) throw new Error('Cannot befriend yourself');

    const existing = await this.friendshipRepository.findByUsers(userId1, userId2);
    if (existing) throw new Error('Friendship already exists');

    const friendship = Friendship.create(null, userId1, userId2);
    const saved = await this.friendshipRepository.save(friendship);
    saved.getUncommittedEvents().forEach(e => this.eventPublisher.publish(e));
    return FriendshipResponseDTO.fromDomain(saved);
  }

  async acceptFriendship(id) {
    const friendship = await this.friendshipRepository.findById(id);
    if (!friendship) throw new Error(`Friendship ${id} not found`);
    friendship.accept();
    const saved = await this.friendshipRepository.save(friendship);
    saved.getUncommittedEvents().forEach(e => this.eventPublisher.publish(e));
    return FriendshipResponseDTO.fromDomain(saved);
  }

  async removeFriendship(id) {
    const friendship = await this.friendshipRepository.findById(id);
    if (!friendship) throw new Error(`Friendship ${id} not found`);
    friendship.remove();
    const saved = await this.friendshipRepository.save(friendship);
    saved.getUncommittedEvents().forEach(e => this.eventPublisher.publish(e));
    return FriendshipResponseDTO.fromDomain(saved);
  }
}

module.exports = FriendshipApplicationService;
