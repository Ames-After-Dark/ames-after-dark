const express = require('express');
const router = express.Router();

function createLocationHourRoutes(container) {
  const locationHourService = container.getService('locationHourApplicationService');

  router.get('/location-hours/:id', async (req, res) => {
    try {
      const locationHour = await locationHourService.getLocationHour(req.params.id);
      res.json(locationHour);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  });

  router.get('/locations/:locationId/hours', async (req, res) => {
    try {
      const hours = await locationHourService.getHoursByLocation(req.params.locationId);
      res.json(hours);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/locations/:locationId/is-open', async (req, res) => {
    try {
      const isOpen = await locationHourService.isLocationOpen(req.params.locationId);
      res.json({ isOpen });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/locations/:locationId/hours', async (req, res) => {
    try {
      const hoursDTO = req.body;
      const hours = await locationHourService.setLocationHours(req.params.locationId, hoursDTO);
      res.status(201).json(hours);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.put('/location-hours/:id', async (req, res) => {
    try {
      const { open, close } = req.body;
      const locationHour = await locationHourService.updateLocationHour(req.params.id, {
        open,
        close,
      });
      res.json(locationHour);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createLocationHourRoutes;
