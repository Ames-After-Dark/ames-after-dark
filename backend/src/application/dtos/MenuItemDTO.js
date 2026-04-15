class MenuItemResponseDTO {
  constructor(id, name, description, price, category, locationId, imageUrl, createdAt) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.price = price;
    this.category = category;
    this.locationId = locationId;
    this.imageUrl = imageUrl;
    this.createdAt = createdAt;
  }

  static fromDomain(menuItemEntity) {
    return new MenuItemResponseDTO(
      menuItemEntity.id,
      menuItemEntity.name,
      menuItemEntity.description,
      menuItemEntity.price,
      menuItemEntity.category,
      menuItemEntity.locationId,
      menuItemEntity.imageUrl,
      menuItemEntity.createdAt
    );
  }
}

class CreateMenuItemDTO {
  constructor(name, description, price, category, locationId, imageUrl) {
    this.name = name;
    this.description = description;
    this.price = price;
    this.category = category;
    this.locationId = locationId;
    this.imageUrl = imageUrl;
  }
}

class UpdateMenuItemDTO {
  constructor(name, description, price, category, imageUrl) {
    this.name = name;
    this.description = description;
    this.price = price;
    this.category = category;
    this.imageUrl = imageUrl;
  }
}

module.exports = {
  MenuItemResponseDTO,
  CreateMenuItemDTO,
  UpdateMenuItemDTO
};
