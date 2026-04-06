/**
 * Refactored Deal Controller
 */

const {
  CreateDealDTO,
  DealResponseDTO,
} = require('../dtos');
const {
  InvalidDealError,
  AggregateNotFoundError,
} = require('../domain/errors');

class DealController {
  constructor(dealDomainService) {
    this.dealService = dealDomainService;
  }

  async createDeal(req, res) {
    try {
      const createDealDTO = CreateDealDTO.fromRequest(req.body);
      const deal = await this.dealService.createDeal(createDealDTO);
      return res.status(201).json(new DealResponseDTO(deal));
    } catch (error) {
      if (error.message.includes('Missing required fields')) {
        return res.status(400).json({ error: error.message });
      }
      if (error instanceof InvalidDealError) {
        return res.status(400).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getDealById(req, res) {
    try {
      const dealId = parseInt(req.params.id, 10);
      if (isNaN(dealId)) return res.status(400).json({ error: 'Invalid deal ID' });

      const deal = await this.dealService.getDealById(dealId);
      return res.json(new DealResponseDTO(deal));
    } catch (error) {
      if (error instanceof AggregateNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getDealsByLocationId(req, res) {
    try {
      const locationId = req.params.locationId;
      if (!locationId) return res.status(400).json({ error: 'Location ID required' });

      const deals = await this.dealService.getDealsByLocationId(locationId);
      return res.json(deals.map(d => new DealResponseDTO(d)));
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getActiveDeals(req, res) {
    try {
      const deals = await this.dealService.getActiveDeals();
      return res.json(deals.map(d => new DealResponseDTO(d)));
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAllDeals(req, res) {
    try {
      const deals = await this.dealService.getAllDeals();
      return res.json(deals.map(d => new DealResponseDTO(d)));
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateDeal(req, res) {
    try {
      const dealId = parseInt(req.params.id, 10);
      if (isNaN(dealId)) return res.status(400).json({ error: 'Invalid deal ID' });

      const updateDealDTO = CreateDealDTO.fromRequest(req.body);
      const deal = await this.dealService.updateDeal(dealId, updateDealDTO);
      return res.json(new DealResponseDTO(deal));
    } catch (error) {
      if (error instanceof AggregateNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof InvalidDealError) {
        return res.status(400).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async publishDeal(req, res) {
    try {
      const dealId = parseInt(req.params.id, 10);
      if (isNaN(dealId)) return res.status(400).json({ error: 'Invalid deal ID' });

      const deal = await this.dealService.publishDeal(dealId);
      return res.json(new DealResponseDTO(deal));
    } catch (error) {
      if (error instanceof AggregateNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async unpublishDeal(req, res) {
    try {
      const dealId = parseInt(req.params.id, 10);
      if (isNaN(dealId)) return res.status(400).json({ error: 'Invalid deal ID' });

      const deal = await this.dealService.unpublishDeal(dealId);
      return res.json(new DealResponseDTO(deal));
    } catch (error) {
      if (error instanceof AggregateNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteDeal(req, res) {
    try {
      const dealId = parseInt(req.params.id, 10);
      if (isNaN(dealId)) return res.status(400).json({ error: 'Invalid deal ID' });

      await this.dealService.deleteDeal(dealId);
      return res.status(204).send();
    } catch (error) {
      if (error instanceof AggregateNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = DealController;
