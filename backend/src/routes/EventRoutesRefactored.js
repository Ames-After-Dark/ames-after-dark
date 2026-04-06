/**
 * Refactored Event Routes
 * DDD-compliant with explicit command semantics
 */

const express = require('express');
const router = express.Router();

module.exports = (eventController) => {
  // ============ Queries ============

  /**
   * Query: Get all active events
   * GET /api/events/active
   */
  router.get('/active', (req, res) => eventController.getActiveEvents(req, res));

  /**
   * Query: Get all events for a location
   * GET /api/events/location/:locationId
   */
  router.get('/location/:locationId', (req, res) => 
    eventController.getEventsByLocationId(req, res)
  );

  /**
   * Query: Get all events
   * GET /api/events
   */
  router.get('/', (req, res) => eventController.getAllEvents(req, res));

  /**
   * Query: Get specific event
   * GET /api/events/:id
   */
  router.get('/:id', (req, res) => eventController.getEventById(req, res));

  // ============ Commands ============

  /**
   * Command: Create event
   * POST /api/events
   */
  router.post('/', (req, res) => eventController.createEvent(req, res));

  /**
   * Command: Update event
   * PUT /api/events/:id
   */
  router.put('/:id', (req, res) => eventController.updateEvent(req, res));

  /**
   * Command: Publish event
   * POST /api/events/:id/commands/publish
   */
  router.post('/:id/commands/publish', (req, res) => 
    eventController.publishEvent(req, res)
  );

  /**
   * Command: Unpublish event
   * POST /api/events/:id/commands/unpublish
   */
  router.post('/:id/commands/unpublish', (req, res) => 
    eventController.unpublishEvent(req, res)
  );

  /**
   * Command: Delete event
   * DELETE /api/events/:id
   */
  router.delete('/:id', (req, res) => eventController.deleteEvent(req, res));

  return router;
};
