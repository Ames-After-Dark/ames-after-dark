const { getServiceContainer } = require('../../infrastructure/ServiceContainer');
const { CreateLocationDTO, UpdateLocationDTO } = require('../../application/dtos/LocationDTO');

/**
 * DDD-refactored Location Controller
 * Following the layered architecture pattern
 */
class LocationController {
  constructor() {
    this.locationService =
      getServiceContainer().getLocationApplicationService();
  }

  /**
   * GET /api/locations
   * Get all locations
   */
  async getLocations(req, res) {
    try {
      const locations = await this.locationService.getAllLocations();
      res.json(locations);
    } catch (err) {
      console.error('Error fetching locations:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * GET /api/locations/:id
   * Get location by ID
   */
  async getLocationById(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }

      const location = await this.locationService.getLocationById(id);
      res.json(location);
    } catch (err) {
      if (err.message.includes('not found')) {
        return res.status(404).json({ message: err.message });
      }
      console.error('Error fetching location:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * POST /api/locations
   * Create new location
   */
  async createLocation(req, res) {
    try {
      const { name, latitude, longitude, address, description, timezone, tags, imageUrl } = req.body;

      const createDTO = new CreateLocationDTO(name, latitude, longitude, address, {
        description,
        timezone,
        tags,
        imageUrl,
      });

      const location = await this.locationService.createLocation(createDTO);
      res.status(201).json(location);
    } catch (err) {
      console.error('Error creating location:', err);
      res.status(400).json({ message: err.message });
    }
  }

  /**
   * PUT /api/locations/:id
   * Update location
   */
  async updateLocation(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }

      const updateDTO = new UpdateLocationDTO(id, req.body);
      const location = await this.locationService.updateLocation(id, updateDTO);
      res.json(location);
    } catch (err) {
      if (err.message.includes('not found')) {
        return res.status(404).json({ message: err.message });
      }
      console.error('Error updating location:', err);
      res.status(400).json({ message: err.message });
    }
  }

  /**
   * DELETE /api/locations/:id
   * Delete location
   */
  async deleteLocation(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }

      await this.locationService.deleteLocation(id);
      res.status(204).send();
    } catch (err) {
      if (err.message.includes('not found')) {
        return res.status(404).json({ message: err.message });
      }
      console.error('Error deleting location:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * GET /api/locations/open
   * Get currently open locations
   */
  async getOpenLocations(req, res) {
    try {
      const locations = await this.locationService.getOpenLocations();
      res.json(locations);
    } catch (err) {
      console.error('Error fetching open locations:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * POST /api/locations/:id/views
   * Record view for location
   */
  async recordView(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }

      const views = await this.locationService.recordLocationView(id);
      res.json({ views });
    } catch (err) {
      if (err.message.includes('not found')) {
        return res.status(404).json({ message: err.message });
      }
      console.error('Error recording view:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}

module.exports = LocationController;
