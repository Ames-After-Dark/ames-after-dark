const express = require('express');
const router = express.Router();

function createUserLocationRoutes(container) {
  const userLocationService = container.getService('userLocationApplicationService');

  router.get('/user-locations/:id', async (req, res) => {
    try {
      const userLocation = await userLocationService.getUserLocation(req.params.id);
      res.json(userLocation);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  });

  router.get('/users/:userId/locations', async (req, res) => {
    try {
      const userLocations = await userLocationService.getUserLocations(req.params.userId);
      res.json(userLocations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/locations/:locationId/visitors', async (req, res) => {
    try {
      const visitors = await userLocationService.getLocationVisitors(req.params.locationId);
      res.json(visitors);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/locations/:locationId/active-visitors', async (req, res) => {
    try {
      const activeVisitors = await userLocationService.getActiveVisitors(req.params.locationId);
      res.json(activeVisitors);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/user-locations/check-in', async (req, res) => {
    try {
      const { userId, locationId } = req.body;
      const userLocation = await userLocationService.checkInUser(userId, locationId);
      res.status(201).json(userLocation);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.post('/user-locations/:id/check-out', async (req, res) => {
    try {
      const userLocation = await userLocationService.checkOutUser(req.params.id);
      res.json(userLocation);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createUserLocationRoutes;
