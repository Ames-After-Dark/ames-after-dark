const express = require('express');
const router = express.Router();

function createLocationRoutes(container) {
  const locationService = container.getService('locationApplicationService');

  router.get('/locations/:id', async (req, res) => {
    try {
      const location = await locationService.getLocation(req.params.id);
      res.json(location);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  });

  router.get('/locations', async (req, res) => {
    try {
      const locations = await locationService.getAllLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/locations/city/:city', async (req, res) => {
    try {
      const locations = await locationService.getLocationsByCity(req.params.city);
      res.json(locations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/locations/nearby', async (req, res) => {
    try {
      const { latitude, longitude, radius } = req.query;
      const locations = await locationService.getNearbyLocations(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(radius) || 5
      );
      res.json(locations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/locations', async (req, res) => {
    try {
      const { name, address, city, state, zip, latitude, longitude } = req.body;
      const location = await locationService.createLocation({
        name,
        address,
        city,
        state,
        zip,
        latitude,
        longitude,
      });
      res.status(201).json(location);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.put('/locations/:id', async (req, res) => {
    try {
      const { name, address, city, state, zip, latitude, longitude } = req.body;
      const location = await locationService.updateLocation(req.params.id, {
        name,
        address,
        city,
        state,
        zip,
        latitude,
        longitude,
      });
      res.json(location);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createLocationRoutes;
