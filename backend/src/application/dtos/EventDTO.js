class CreateEventDTO {
  constructor(title, description, startTime, endTime, locationId, imageUrl) {
    this.title = title;
    this.description = description;
    this.startTime = startTime;
    this.endTime = endTime;
    this.locationId = locationId;
    this.imageUrl = imageUrl;
  }

  validate() {
    if (!this.title || this.title.trim().length === 0) {
      throw new Error('Event title is required');
    }
    if (!this.locationId) {
      throw new Error('Location ID is required');
    }
    if (!this.startTime || !this.endTime) {
      throw new Error('Start and end times are required');
    }
    const startDate = new Date(this.startTime);
    const endDate = new Date(this.endTime);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Invalid date format');
    }
    if (endDate <= startDate) {
      throw new Error('End time must be after start time');
    }
  }
}

class UpdateEventDTO {
  constructor(title, description, startTime, endTime, imageUrl) {
    this.title = title;
    this.description = description;
    this.startTime = startTime;
    this.endTime = endTime;
    this.imageUrl = imageUrl;
  }

  validate() {
    if (this.title !== undefined && this.title.trim().length === 0) {
      throw new Error('Event title cannot be empty');
    }
    if (this.startTime && this.endTime) {
      const startDate = new Date(this.startTime);
      const endDate = new Date(this.endTime);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid date format');
      }
      if (endDate <= startDate) {
        throw new Error('End time must be after start time');
      }
    }
  }
}

class EventResponseDTO {
  static fromDomain(event) {
    const obj = event.toObject();
    return {
      id: obj.id,
      title: obj.title,
      description: obj.description,
      startTime: obj.startTime,
      endTime: obj.endTime,
      locationId: obj.locationId,
      attendeeCount: obj.attendeeCount,
      imageUrl: obj.imageUrl,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    };
  }
}

module.exports = {
  CreateEventDTO,
  UpdateEventDTO,
  EventResponseDTO,
};
