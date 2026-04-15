class BannerDTO {
  static create(title, content, imageUrl, startDate, endDate, priority) {
    return { title, content, imageUrl, startDate, endDate, priority };
  }

  static validate(dto) {
    if (!dto.title) throw new Error('Banner title is required');
  }

  static fromDomain(banner) {
    const obj = banner.toObject();
    return { id: obj.id, title: obj.title, content: obj.content, imageUrl: obj.imageUrl,
             isActive: obj.isActive, startDate: obj.startDate, endDate: obj.endDate,
             priority: obj.priority, createdAt: obj.createdAt, updatedAt: obj.updatedAt };
  }
}

module.exports = BannerDTO;
