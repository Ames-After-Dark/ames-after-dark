const Banner = require('../../domain/entities/Banner');
const { BannerResponseDTO } = require('../dtos/BannerDTO');

class BannerApplicationService {
  constructor(bannerRepository, eventPublisher) {
    this.bannerRepository = bannerRepository;
    this.eventPublisher = eventPublisher;
  }

  async getBanner(id) {
    const banner = await this.bannerRepository.findById(id);
    if (!banner) throw new Error(`Banner ${id} not found`);
    return BannerResponseDTO.fromDomain(banner);
  }

  async getAllActiveBanners() {
    const banners = await this.bannerRepository.findAllActive();
    return banners.map(b => BannerResponseDTO.fromDomain(b));
  }

  async getBannersByLocation(locationId) {
    const banners = await this.bannerRepository.findByLocation(locationId);
    return banners.map(b => BannerResponseDTO.fromDomain(b));
  }

  async createBanner(createBannerDTO) {
    const { title, description, imageUrl, locationId, startDate, endDate } = createBannerDTO;
    
    if (!title || !imageUrl) throw new Error('Title and image URL are required');
    if (startDate && endDate && startDate >= endDate) throw new Error('Start date must be before end date');

    const banner = Banner.create(null, title, description, imageUrl, locationId, startDate, endDate);
    const saved = await this.bannerRepository.save(banner);
    saved.getUncommittedEvents().forEach(e => this.eventPublisher.publish(e));
    return BannerResponseDTO.fromDomain(saved);
  }

  async updateBanner(id, updateBannerDTO) {
    const banner = await this.bannerRepository.findById(id);
    if (!banner) throw new Error(`Banner ${id} not found`);

    const { title, description, imageUrl, startDate, endDate } = updateBannerDTO;
    if (title) banner.setTitle(title);
    if (description !== undefined) banner.setDescription(description);
    if (imageUrl) banner.setImageUrl(imageUrl);
    if (startDate || endDate) {
      if (startDate && endDate && startDate >= endDate) throw new Error('Start date must be before end date');
      if (startDate) banner.setStartDate(startDate);
      if (endDate) banner.setEndDate(endDate);
    }

    const saved = await this.bannerRepository.save(banner);
    saved.getUncommittedEvents().forEach(e => this.eventPublisher.publish(e));
    return BannerResponseDTO.fromDomain(saved);
  }

  async deleteBanner(id) {
    const banner = await this.bannerRepository.findById(id);
    if (!banner) throw new Error(`Banner ${id} not found`);
    banner.deactivate();
    const saved = await this.bannerRepository.save(banner);
    saved.getUncommittedEvents().forEach(e => this.eventPublisher.publish(e));
  }
}

module.exports = BannerApplicationService;
