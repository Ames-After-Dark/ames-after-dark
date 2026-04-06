/**
 * Refactored Banner Controller
 * Uses domain services and DTOs
 * Follows clear command/query separation
 */

const {
  CreateBannerDTO,
  BannerResponseDTO,
} = require('../dtos');
const {
  InvalidBannerError,
  AggregateNotFoundError,
} = require('../domain/errors');

class BannerController {
  constructor(bannerDomainService) {
    this.bannerService = bannerDomainService;
  }

  /**
   * Command: Create a new banner
   * POST /api/banners
   */
  async createBanner(req, res) {
    try {
      const createBannerDTO = CreateBannerDTO.fromRequest(req.body);
      const banner = await this.bannerService.createBanner(createBannerDTO);
      
      return res.status(201).json(new BannerResponseDTO(banner));
    } catch (error) {
      if (error.message.includes('Missing required fields')) {
        return res.status(400).json({ error: error.message });
      }
      if (error instanceof InvalidBannerError) {
        return res.status(400).json({ error: error.message });
      }
      
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Query: Get banner by ID
   * GET /api/banners/:id
   */
  async getBannerById(req, res) {
    try {
      const bannerId = parseInt(req.params.id, 10);
      
      if (isNaN(bannerId)) {
        return res.status(400).json({ error: 'Invalid banner ID' });
      }

      const banner = await this.bannerService.getBannerById(bannerId);
      return res.json(new BannerResponseDTO(banner));
    } catch (error) {
      if (error instanceof AggregateNotFoundError) {
        return res.status(404).json({ error: error.message });
      }

      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Query: Get all active banners
   * GET /api/banners/active
   */
  async getActiveBanners(req, res) {
    try {
      const banners = await this.bannerService.getActiveBanners();
      return res.json(banners.map(b => new BannerResponseDTO(b)));
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Query: Get all banners
   * GET /api/banners
   */
  async getAllBanners(req, res) {
    try {
      const banners = await this.bannerService.getAllBanners();
      return res.json(banners.map(b => new BannerResponseDTO(b)));
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Command: Update banner
   * PUT /api/banners/:id
   */
  async updateBanner(req, res) {
    try {
      const bannerId = parseInt(req.params.id, 10);
      
      if (isNaN(bannerId)) {
        return res.status(400).json({ error: 'Invalid banner ID' });
      }

      const updateBannerDTO = CreateBannerDTO.fromRequest(req.body);
      const banner = await this.bannerService.updateBanner(bannerId, updateBannerDTO);
      
      return res.json(new BannerResponseDTO(banner));
    } catch (error) {
      if (error instanceof AggregateNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof InvalidBannerError) {
        return res.status(400).json({ error: error.message });
      }

      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Command: Activate banner
   * POST /api/banners/:id/activate
   */
  async activateBanner(req, res) {
    try {
      const bannerId = parseInt(req.params.id, 10);
      
      if (isNaN(bannerId)) {
        return res.status(400).json({ error: 'Invalid banner ID' });
      }

      const banner = await this.bannerService.activateBanner(bannerId);
      return res.json(new BannerResponseDTO(banner));
    } catch (error) {
      if (error instanceof AggregateNotFoundError) {
        return res.status(404).json({ error: error.message });
      }

      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Command: Deactivate banner
   * POST /api/banners/:id/deactivate
   */
  async deactivateBanner(req, res) {
    try {
      const bannerId = parseInt(req.params.id, 10);
      
      if (isNaN(bannerId)) {
        return res.status(400).json({ error: 'Invalid banner ID' });
      }

      const banner = await this.bannerService.deactivateBanner(bannerId);
      return res.json(new BannerResponseDTO(banner));
    } catch (error) {
      if (error instanceof AggregateNotFoundError) {
        return res.status(404).json({ error: error.message });
      }

      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Command: Delete banner
   * DELETE /api/banners/:id
   */
  async deleteBanner(req, res) {
    try {
      const bannerId = parseInt(req.params.id, 10);
      
      if (isNaN(bannerId)) {
        return res.status(400).json({ error: 'Invalid banner ID' });
      }

      await this.bannerService.deleteBanner(bannerId);
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

module.exports = BannerController;
