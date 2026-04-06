/**
 * Refactored Location Controller
 */

const {
  CreateLocationDTO,
  LocationResponseDTO,
} = require('../dtos');
const {
  InvalidLocationError,
  AggregateNotFoundError,
} = require('../domain/errors');

class LocationController {
  constructor(locationDomainService) {
    this.locationService = locationDomainService;
  }

  async createLocation(req, res) {
    try {
      const createLocationDTO = CreateLocationDTO.fromRequest(req.body);
      const location = await this.locationService.createLocation(createLocationDTO);
      return res.status(201).json(new LocationResponseDTO(location));
    } catch (error) {
      if (error.message.includes('Missing required fields')) {
        return res.status(400).json({ error: error.message });
      }
      if (error instanceof InvalidLocationError) {
        return res.status(400).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getLocationById(req, res) {
    try {
      const locationId = parseInt(req.params.id, 10);
      if (isNaN(locationId)) return res.status(400).json({ error: 'Invalid location ID' });

      const location = await this.locationService.getLocationById(locationId);
      return res.json(new LocationResponseDTO(location));
    } catch (error) {
      if (error instanceof AggregateNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getOpenLocations(req, res) {
    try {
      const utc = req.query.utc ? new Date(req.query.utc) : new Date();
      const locations = await this.locationService.getOpenLocations(utc);
      return res.json(locations.map(l => new LocationResponseDTO(l)));
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getNearbyLocations(req, res) {
    try {
      const latitude = parseFloat(req.query.latitude);
      const longitude = parseFloat(req.query.longitude);
      const radiusKm = req.query.radius ? parseFloat(req.query.radius) : 5;

      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ error: 'Valid latitude and longitude required' });
      }

      const locations = await this.locationService.getLocationsNear(latitude, longitude, radiusKm);
      return res.json(locations.map(l => new LocationResponseDTO(l)));
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAllLocations(req, res) {
    try {
      const locations = await this.locationService.getAllLocations();
      return res.json(locations.map(l => new LocationResponseDTO(l)));
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateLocation(req, res) {
    try {
      const locationId = parseInt(req.params.id, 10);
      if (isNaN(locationId)) return res.status(400).json({ error: 'Invalid location ID' });

      const updateLocationDTO = CreateLocationDTO.fromRequest(req.body);
      const location = await this.locationService.updateLocation(locationId, updateLocationDTO);
      return res.json(new LocationResponseDTO(location));
    } catch (error) {
      if (error instanceof AggregateNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof InvalidLocationError) {
        return res.status(400).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async recordLocationView(req, res) {
    try {
      const locationId = parseInt(req.params.id, 10);
      if (isNaN(locationId)) return res.status(400).json({ error: 'Invalid location ID' });

      const location = await this.locationService.recordLocationView(locationId);
      return res.json(new LocationResponseDTO(location));
    } catch (error) {
      if (error instanceof AggregateNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteLocation(req, res) {
    try {
      const locationId = parseInt(req.params.id, 10);
      if (isNaN(locationId)) return res.status(400).json({ error: 'Invalid location ID' });

      await this.locationService.deleteLocation(locationId);
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

module.exports = LocationController;
