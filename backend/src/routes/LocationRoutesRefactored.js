/**
 * Refactored Location Routes
 * DDD-compliant - Location is aggregate root for hours and menu items
 */

const express = require('express');
const router = express.Router();

module.exports = (locationController) => {
  // ============ Queries ============

  /**
   * Query: Get all open locations (at specified time or now)
   * GET /api/locations/open?utc=2026-04-06...
   * 
   * Optional: utc query parameter for specific time
   */
  router.get('/open', (req, res) => locationController.getOpenLocations(req, res));

  /**
   * Query: Get nearby locations
   * GET /api/locations/nearby?latitude=40.7128&longitude=-74.0060&radius=5
   */
  router.get('/nearby', (req, res) => locationController.getNearbyLocations(req, res));

  /**
   * Query: Get all locations
   * GET /api/locations
   */
  router.get('/', (req, res) => locationController.getAllLocations(req, res));

  /**
   * Query: Get specific location
   * GET /api/locations/:id
   */
  router.get('/:id', (req, res) => locationController.getLocationById(req, res));

  // ============ Commands ============

  /**
   * Command: Create location
   * POST /api/locations
   * 
   * Request body: { name, address, latitude, longitude }
   */
  router.post('/', (req, res) => locationController.createLocation(req, res));

  /**
   * Command: Update location
   * PUT /api/locations/:id
   */
  router.put('/:id', (req, res) => locationController.updateLocation(req, res));

  /**
   * Command: Record view (analytics event)
   * POST /api/locations/:id/commands/record-view
   * 
   * Explicit command for tracking when users view a location
   */
  router.post('/:id/commands/record-view', (req, res) => 
    locationController.recordLocationView(req, res)
  );

  /**
   * Command: Delete location
   * DELETE /api/locations/:id
   */
  router.delete('/:id', (req, res) => locationController.deleteLocation(req, res));

  return router;
};
