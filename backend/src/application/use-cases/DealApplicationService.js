const Deal = require('../../domain/entities/Deal');
const { DealResponseDTO } = require('../dtos/DealDTO');

class DealApplicationService {
  constructor(dealRepository, eventPublisher) {
    this.dealRepository = dealRepository;
    this.eventPublisher = eventPublisher;
  }

  async getAllDeals() {
    const deals = await this.dealRepository.findAll();
    return deals.map(d => DealResponseDTO.fromDomain(d));
  }

  async getDealById(id) {
    const deal = await this.dealRepository.findById(id);
    if (!deal) throw new Error(`Deal ${id} not found`);
    return DealResponseDTO.fromDomain(deal);
  }

  async getDealsByLocation(locationId) {
    const deals = await this.dealRepository.findByLocationId(locationId);
    return deals.map(d => DealResponseDTO.fromDomain(d));
  }

  async getActiveDeals() {
    const deals = await this.dealRepository.findActive();
    return deals.map(d => DealResponseDTO.fromDomain(d));
  }

  async createDeal(dto) {
    dto.validate();
    const deal = Deal.create(null, dto.title, dto.description, dto.discount, dto.locationId, {
      startDate: dto.startDate,
      endDate: dto.endDate,
    });
    const saved = await this.dealRepository.save(deal);
    saved.getUncommittedEvents().forEach(e => this.eventPublisher.publish(e));
    return DealResponseDTO.fromDomain(saved);
  }

  async updateDeal(id, dto) {
    dto.validate();
    const deal = await this.dealRepository.findById(id);
    if (!deal) throw new Error(`Deal ${id} not found`);
    deal.updateDetails(dto.title, dto.description, dto.discount, dto.startDate, dto.endDate);
    const saved = await this.dealRepository.save(deal);
    saved.getUncommittedEvents().forEach(e => this.eventPublisher.publish(e));
    return DealResponseDTO.fromDomain(saved);
  }

  async deleteDeal(id) {
    const deal = await this.dealRepository.findById(id);
    if (!deal) throw new Error(`Deal ${id} not found`);
    await this.dealRepository.delete(id);
  }

  async activateDeal(id) {
    const deal = await this.dealRepository.findById(id);
    if (!deal) throw new Error(`Deal ${id} not found`);
    deal.markActive();
    const saved = await this.dealRepository.save(deal);
    saved.getUncommittedEvents().forEach(e => this.eventPublisher.publish(e));
    return DealResponseDTO.fromDomain(saved);
  }

  async deactivateDeal(id) {
    const deal = await this.dealRepository.findById(id);
    if (!deal) throw new Error(`Deal ${id} not found`);
    deal.markInactive();
    const saved = await this.dealRepository.save(deal);
    saved.getUncommittedEvents().forEach(e => this.eventPublisher.publish(e));
    return DealResponseDTO.fromDomain(saved);
  }
}

module.exports = DealApplicationService;
