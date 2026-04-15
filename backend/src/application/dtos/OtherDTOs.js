class UserLocationDTO {
  static create(userId, latitude, longitude) {
    return { userId, latitude, longitude };
  }

  static fromDomain(userLocation) {
    const obj = userLocation.toObject();
    return { id: obj.id, userId: obj.userId, latitude: obj.latitude, longitude: obj.longitude,
             accuracy: obj.accuracy, createdAt: obj.createdAt, updatedAt: obj.updatedAt };
  }
}

class MenuItemDTO {
  static create(locationId, name, description, price, category) {
    return { locationId, name, description, price, category };
  }

  static fromDomain(menuItem) {
    const obj = menuItem.toObject();
    return { id: obj.id, locationId: obj.locationId, name: obj.name, description: obj.description,
             price: obj.price, category: obj.category, isAvailable: obj.isAvailable, createdAt: obj.createdAt };
  }
}

class LocationHourDTO {
  static create(locationId, dayOfWeek, openTime, closeTime) {
    return { locationId, dayOfWeek, openTime, closeTime };
  }

  static fromDomain(locationHour) {
    const obj = locationHour.toObject();
    return { id: obj.id, locationId: obj.locationId, dayOfWeek: obj.dayOfWeek,
             openTime: obj.openTime, closeTime: obj.closeTime, isOpen: obj.isOpen };
  }
}

class UserSettingDTO {
  static create(userId) {
    return { userId };
  }

  static fromDomain(userSetting) {
    const obj = userSetting.toObject();
    return { id: obj.id, userId: obj.userId, notificationsEnabled: obj.notificationsEnabled,
             privacyLevel: obj.privacyLevel, shareLocation: obj.shareLocation, theme: obj.theme };
  }
}

module.exports = { UserLocationDTO, MenuItemDTO, LocationHourDTO, UserSettingDTO };
