class UserFavoriteResponseDTO {
  constructor(id, userId, locationId, createdAt) {
    this.id = id;
    this.userId = userId;
    this.locationId = locationId;
    this.createdAt = createdAt;
  }

  static fromDomain(userFavoriteEntity) {
    return new UserFavoriteResponseDTO(
      userFavoriteEntity.id,
      userFavoriteEntity.userId,
      userFavoriteEntity.locationId,
      userFavoriteEntity.createdAt
    );
  }
}

class CreateUserFavoriteDTO {
  constructor(userId, locationId) {
    this.userId = userId;
    this.locationId = locationId;
  }
}

module.exports = {
  UserFavoriteResponseDTO,
  CreateUserFavoriteDTO
};
