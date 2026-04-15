const express = require('express');
const router = express.Router();

function createEventRoutes(container) {
  const eventService = container.getService('eventApplicationService');

  router.get('/events/:id', async (req, res) => {
    try {
      const event = await eventService.getEvent(req.params.id);
      res.json(event);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  });

  router.get('/events', async (req, res) => {
    try {
      const limit = req.query.limit || 10;
      const events = await eventService.getUpcomingEvents(limit);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/locations/:locationId/events', async (req, res) => {
    try {
      const events = await eventService.getEventsByLocation(req.params.locationId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/events', async (req, res) => {
    try {
      const { name, description, locationId, startTime, endTime, imageUrl } = req.body;
      const event = await eventService.createEvent({
        name,
        description,
        locationId,
        startTime,
        endTime,
        imageUrl,
      });
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.put('/events/:id', async (req, res) => {
    try {
      const { name, description, startTime, endTime, imageUrl } = req.body;
      const event = await eventService.updateEvent(req.params.id, {
        name,
        description,
        startTime,
        endTime,
        imageUrl,
      });
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.delete('/events/:id', async (req, res) => {
    try {
      await eventService.cancelEvent(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createEventRoutes;
