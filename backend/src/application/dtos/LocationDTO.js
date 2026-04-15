/**
 * Location Response DTO
 * Used for sending location data to clients
 */
class LocationResponseDTO {
  constructor(
    id,
    name,
    address,
    coordinates,
    description,
    isOpen,
    views,
    timezone,
    tags,
    imageUrl
  ) {
    this.id = id;
    this.name = name;
    this.address = address;
    this.coordinates = coordinates;
    this.description = description;
    this.isOpen = isOpen;
    this.views = views;
    this.timezone = timezone;
    this.tags = tags;
    this.imageUrl = imageUrl;
  }

  static fromDomain(location) {
    return new LocationResponseDTO(
      location.id,
      location.name,
      location.address,
      location.coordinates.toObject(),
      location.description,
      location.isOpen,
      location.views,
      location.timezone,
      location.tags,
      location.imageUrl
    );
  }
}

/**
 * Create Location Request DTO
 */
class CreateLocationDTO {
  constructor(name, latitude, longitude, address, props = {}) {
    this.name = name;
    this.latitude = latitude;
    this.longitude = longitude;
    this.address = address;
    this.description = props.description;
    this.timezone = props.timezone || 'UTC';
    this.tags = props.tags || [];
    this.imageUrl = props.imageUrl;
  }

  validate() {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Location name is required');
    }
    if (!Number.isFinite(this.latitude) || !Number.isFinite(this.longitude)) {
      throw new Error('Valid latitude and longitude are required');
    }
    return true;
  }
}

/**
 * Update Location Request DTO
 */
class UpdateLocationDTO {
  constructor(id, props = {}) {
    this.id = id;
    this.name = props.name;
    this.address = props.address;
    this.description = props.description;
    this.imageUrl = props.imageUrl;
    this.timezone = props.timezone;
  }
}

module.exports = {
  LocationResponseDTO,
  CreateLocationDTO,
  UpdateLocationDTO,
};
