/**
 * Domain Service - Deal Management
 */

const { Deal } = require('../entities');
const { EntityIds, DateRange } = require('../valueObjects');
const { AggregateNotFoundError, InvalidDealError } = require('../errors');

class DealDomainService {
  constructor(dealRepository, locationRepository) {
    this.dealRepository = dealRepository;
    this.locationRepository = locationRepository;
  }

  async createDeal(command) {
    try {
      const deal = new Deal(
        null,
        command.title,
        command.description,
        command.locationId ? EntityIds.locationId(command.locationId) : null
      );

      // Add occurrences if provided
      if (command.occurrences && Array.isArray(command.occurrences)) {
        command.occurrences.forEach(o => {
          deal.addOccurrence(o.startDate, o.endDate);
        });
      }

      return this.dealRepository.save(deal);
    } catch (error) {
      if (error.message.includes('Deal')) {
        throw new InvalidDealError(error.message);
      }
      throw error;
    }
  }

  async getDealById(dealId) {
    const id = EntityIds.dealId(dealId);
    const deal = await this.dealRepository.findById(id);
    
    if (!deal) {
      throw new AggregateNotFoundError('Deal', id.value);
    }
    return deal;
  }

  async getDealsByLocationId(locationId) {
    const id = EntityIds.locationId(locationId);
    return this.dealRepository.findByLocationId(id);
  }

  async getActiveDeals(now = new Date()) {
    const deals = await this.dealRepository.findAll();
    return deals.filter(d => d.hasActiveOccurrence(now));
  }

  async getAllDeals() {
    return this.dealRepository.findAll();
  }

  async updateDeal(dealId, command) {
    const id = EntityIds.dealId(dealId);
    const deal = await this.dealRepository.findById(id);
    
    if (!deal) {
      throw new AggregateNotFoundError('Deal', id.value);
    }

    try {
      if (command.title) deal.title = command.title;
      if (command.description) deal.description = command.description;
      
      if (command.occurrences && Array.isArray(command.occurrences)) {
        deal.replaceOccurrences(command.occurrences);
      }

      return this.dealRepository.save(deal);
    } catch (error) {
      throw new InvalidDealError(error.message);
    }
  }

  async publishDeal(dealId) {
    const id = EntityIds.dealId(dealId);
    const deal = await this.dealRepository.findById(id);
    
    if (!deal) {
      throw new AggregateNotFoundError('Deal', id.value);
    }

    deal.activate();
    return this.dealRepository.save(deal);
  }

  async unpublishDeal(dealId) {
    const id = EntityIds.dealId(dealId);
    const deal = await this.dealRepository.findById(id);
    
    if (!deal) {
      throw new AggregateNotFoundError('Deal', id.value);
    }

    deal.deactivate();
    return this.dealRepository.save(deal);
  }

  async deleteDeal(dealId) {
    const id = EntityIds.dealId(dealId);
    const deal = await this.dealRepository.findById(id);
    
    if (!deal) {
      throw new AggregateNotFoundError('Deal', id.value);
    }

    return this.dealRepository.delete(id);
  }
}

module.exports = DealDomainService;
