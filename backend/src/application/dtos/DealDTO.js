class CreateDealDTO {
  constructor(title, description, discount, locationId, startDate, endDate) {
    this.title = title;
    this.description = description;
    this.discount = discount;
    this.locationId = locationId;
    this.startDate = startDate;
    this.endDate = endDate;
  }

  validate() {
    if (!this.title || this.title.trim().length === 0) throw new Error('Deal title is required');
    if (!this.locationId) throw new Error('Location ID is required');
    if (typeof this.discount !== 'number' || this.discount < 0 || this.discount > 100) {
      throw new Error('Discount must be between 0 and 100');
    }
  }
}

class UpdateDealDTO {
  constructor(title, description, discount, startDate, endDate) {
    this.title = title;
    this.description = description;
    this.discount = discount;
    this.startDate = startDate;
    this.endDate = endDate;
  }

  validate() {
    if (this.title !== undefined && this.title.trim().length === 0) {
      throw new Error('Deal title cannot be empty');
    }
    if (this.discount !== undefined && (this.discount < 0 || this.discount > 100)) {
      throw new Error('Discount must be between 0 and 100');
    }
  }
}

class DealResponseDTO {
  static fromDomain(deal) {
    const obj = deal.toObject();
    return {
      id: obj.id,
      title: obj.title,
      description: obj.description,
      discount: obj.discount,
      locationId: obj.locationId,
      isActive: obj.isActive,
      startDate: obj.startDate,
      endDate: obj.endDate,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    };
  }
}

module.exports = { CreateDealDTO, UpdateDealDTO, DealResponseDTO };
