class UserLocationResponseDTO {
  constructor(id, userId, locationId, checkInTime, checkOutTime) {
    this.id = id;
    this.userId = userId;
    this.locationId = locationId;
    this.checkInTime = checkInTime;
    this.checkOutTime = checkOutTime;
  }

  static fromDomain(userLocationEntity) {
    return new UserLocationResponseDTO(
      userLocationEntity.id,
      userLocationEntity.userId,
      userLocationEntity.locationId,
      userLocationEntity.checkInTime,
      userLocationEntity.checkOutTime
    );
  }
}

class CreateUserLocationDTO {
  constructor(userId, locationId) {
    this.userId = userId;
    this.locationId = locationId;
  }
}

module.exports = {
  UserLocationResponseDTO,
  CreateUserLocationDTO
};
