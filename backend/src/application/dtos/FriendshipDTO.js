class CreateFriendshipDTO {
  constructor(userId1, userId2) {
    this.userId1 = userId1;
    this.userId2 = userId2;
  }

  validate() {
    if (!this.userId1 || !this.userId2) throw new Error('Both user IDs are required');
    if (this.userId1 === this.userId2) throw new Error('Cannot befriend yourself');
  }
}

class UpdateFriendshipDTO {
  constructor(status) {
    this.status = status;
  }

  validate() {
    const valid = ['pending', 'accepted', 'rejected', 'removed'];
    if (!valid.includes(this.status)) throw new Error('Invalid status');
  }
}

class FriendshipResponseDTO {
  static fromDomain(friendship) {
    const obj = friendship.toObject();
    return {
      id: obj.id,
      userId1: obj.userId1,
      userId2: obj.userId2,
      status: obj.status,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    };
  }
}

module.exports = { CreateFriendshipDTO, UpdateFriendshipDTO, FriendshipResponseDTO };
