/**
 * Data Transfer Objects (DTOs)
 * Used for request/response handling and API boundaries
 */

/**
 * Banner DTOs
 */
class CreateBannerDTO {
  constructor(name, imageUrl) {
    this.name = name;
    this.imageUrl = imageUrl;
  }

  static fromRequest(req) {
    const { name, image_url } = req;
    if (!name || !image_url) {
      throw new Error('Missing required fields: name, image_url');
    }
    return new CreateBannerDTO(name, image_url);
  }
}

class BannerResponseDTO {
  constructor(banner) {
    this.id = banner.id.value;
    this.name = banner.name;
    this.imageUrl = banner.imageUrl;
    this.isActive = banner.isActive;
    this.createdAt = banner.createdAt;
  }
}

/**
 * Deal DTOs
 */
class CreateDealDTO {
  constructor(title, description, locationId, occurrences) {
    this.title = title;
    this.description = description;
    this.locationId = locationId;
    this.occurrences = occurrences || [];
  }

  static fromRequest(req) {
    const { title, description, location_id, occurrences } = req;
    if (!title || !description) {
      throw new Error('Missing required fields: title, description');
    }
    return new CreateDealDTO(title, description, location_id, occurrences);
  }
}

class DealResponseDTO {
  constructor(deal) {
    this.id = deal.id.value;
    this.title = deal.title;
    this.description = deal.description;
    this.locationId = deal.locationId?.value;
    this.isActive = deal.isActive;
    this.occurrences = deal.occurrences.map(o => ({
      startDate: o.startDate,
      endDate: o.endDate,
    }));
    this.createdAt = deal.createdAt;
  }
}

/**
 * Event DTOs
 */
class CreateEventDTO {
  constructor(title, description, locationId, occurrences) {
    this.title = title;
    this.description = description;
    this.locationId = locationId;
    this.occurrences = occurrences || [];
  }

  static fromRequest(req) {
    const { title, description, location_id, occurrences } = req;
    if (!title || !description) {
      throw new Error('Missing required fields: title, description');
    }
    return new CreateEventDTO(title, description, location_id, occurrences);
  }
}

class EventResponseDTO {
  constructor(event) {
    this.id = event.id.value;
    this.title = event.title;
    this.description = event.description;
    this.locationId = event.locationId?.value;
    this.isActive = event.isActive;
    this.occurrences = event.occurrences.map(o => ({
      startDate: o.startDate,
      endDate: o.endDate,
    }));
    this.createdAt = event.createdAt;
  }
}

/**
 * Location DTOs
 */
class CreateLocationDTO {
  constructor(name, address, latitude, longitude) {
    this.name = name;
    this.address = address;
    this.latitude = latitude;
    this.longitude = longitude;
  }

  static fromRequest(req) {
    const { name, address, latitude, longitude } = req;
    if (!name || !address || latitude === undefined || longitude === undefined) {
      throw new Error('Missing required fields: name, address, latitude, longitude');
    }
    return new CreateLocationDTO(name, address, latitude, longitude);
  }
}

class LocationResponseDTO {
  constructor(location) {
    this.id = location.id.value;
    this.name = location.name;
    this.address = location.address;
    this.latitude = location.latitude;
    this.longitude = location.longitude;
    this.views = location.views;
    this.createdAt = location.createdAt;
  }
}

/**
 * User DTOs
 */
class CreateUserDTO {
  constructor(auth0Id, username, email) {
    this.auth0Id = auth0Id;
    this.username = username;
    this.email = email;
  }

  static fromRequest(req) {
    const { auth0_id, username, email } = req;
    if (!auth0_id || !username || !email) {
      throw new Error('Missing required fields: auth0_id, username, email');
    }
    return new CreateUserDTO(auth0_id, username, email);
  }
}

class UserResponseDTO {
  constructor(user) {
    this.id = user.id.value;
    this.auth0Id = user.auth0Id.value;
    this.username = user.username.value;
    this.email = user.email.value;
    this.bio = user.bio;
    this.createdAt = user.createdAt;
  }
}

class UserProfileDTO {
  constructor(user) {
    this.id = user.id.value;
    this.username = user.username.value;
    this.email = user.email.value;
    this.bio = user.bio;
    this.profilePhotoId = user.profilePhotoId;
    this.favoriteDrinkId = user.favoriteDrinkId;
    this.favoriteFavoriteLocationId = user.favoriteLocationId;
    this.favoriteLocations = user.favoriteLocationIds;
    this.friends = user.friends;
    this.pendingFriendRequests = user.pendingFriendRequests;
    this.settings = {
      locationSharingMode: user.settings.locationSharingMode,
      isInGhostMode: user.isInGhostMode(),
      ghostModeUntil: user.settings.ghostModeUntil,
    };
  }
}

module.exports = {
  CreateBannerDTO,
  BannerResponseDTO,
  CreateDealDTO,
  DealResponseDTO,
  CreateEventDTO,
  EventResponseDTO,
  CreateLocationDTO,
  LocationResponseDTO,
  CreateUserDTO,
  UserResponseDTO,
  UserProfileDTO,
};
