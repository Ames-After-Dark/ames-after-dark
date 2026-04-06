/**
 * Refactored Deal Routes
 * DDD-compliant with clear command/query semantics
 * 
 * Route Naming Patterns:
 * - Query endpoints: Descriptive nouns (GET /deals/active)
 * - Command endpoints: Explicit commands (POST /deals/:id/commands/publish)
 */

const express = require('express');
const router = express.Router();

module.exports = (dealController) => {
  // ============ Queries ============

  /**
   * Query: Get all active deals (currently running)
   * GET /api/deals/active
   */
  router.get('/active', (req, res) => dealController.getActiveDeals(req, res));

  /**
   * Query: Get all deals for a location
   * GET /api/deals/location/:locationId
   */
  router.get('/location/:locationId', (req, res) => 
    dealController.getDealsByLocationId(req, res)
  );

  /**
   * Query: Get all deals (admin view)
   * GET /api/deals
   */
  router.get('/', (req, res) => dealController.getAllDeals(req, res));

  /**
   * Query: Get specific deal
   * GET /api/deals/:id
   */
  router.get('/:id', (req, res) => dealController.getDealById(req, res));

  // ============ Commands ============

  /**
   * Command: Create deal
   * POST /api/deals
   * 
   * Request body: { title, description, location_id, occurrences }
   */
  router.post('/', (req, res) => dealController.createDeal(req, res));

  /**
   * Command: Update deal
   * PUT /api/deals/:id
   */
  router.put('/:id', (req, res) => dealController.updateDeal(req, res));

  /**
   * Command: Publish deal (make visible to users)
   * POST /api/deals/:id/commands/publish
   * 
   * Explicit intent instead of implicit state change via PUT
   */
  router.post('/:id/commands/publish', (req, res) => 
    dealController.publishDeal(req, res)
  );

  /**
   * Command: Unpublish deal (hide from users)
   * POST /api/deals/:id/commands/unpublish
   */
  router.post('/:id/commands/unpublish', (req, res) => 
    dealController.unpublishDeal(req, res)
  );

  /**
   * Command: Delete deal
   * DELETE /api/deals/:id
   */
  router.delete('/:id', (req, res) => dealController.deleteDeal(req, res));

  return router;
};
