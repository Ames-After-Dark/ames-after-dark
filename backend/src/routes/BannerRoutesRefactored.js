/**
 * Refactored Banner Routes
 * DDD-compliant with clear command/query separation
 * 
 * HTTP Method Semantics:
 * - GET: Pure queries, no side effects
 * - POST: Commands (state-changing operations)
 * - PUT: Full resource replacement
 * - DELETE: Resource deletion
 */

const express = require('express');
const router = express.Router();

/**
 * DEPENDENCY INJECTION PATTERN
 * Routes should receive controller as dependency
 * This makes testing and swapping implementations easier
 */
module.exports = (bannerController) => {
  /**
   * Query: Get all active banners
   * GET /api/banners/active
   * 
   * Returns banners that are currently active
   * No authentication required (public data)
   */
  router.get('/active', (req, res) => bannerController.getActiveBanners(req, res));

  /**
   * Query: Get banner by ID
   * GET /api/banners/:id
   * 
   * Returns a specific banner by its ID
   * 404 if not found
   */
  router.get('/:id', (req, res) => bannerController.getBannerById(req, res));

  /**
   * Command: Create banner
   * POST /api/banners
   * 
   * Request body: { name, image_url }
   * Returns: Created banner with 201 status
   */
  router.post('/', (req, res) => bannerController.createBanner(req, res));

  /**
   * Command: Update banner
   * PUT /api/banners/:id
   * 
   * Request body: { name, image_url }
   * Returns: Updated banner
   */
  router.put('/:id', (req, res) => bannerController.updateBanner(req, res));

  /**
   * Command: Activate banner (make visible)
   * POST /api/banners/:id/commands/activate
   * 
   * Explicit intent: activate this banner
   * Better than PATCH which is ambiguous
   */
  router.post('/:id/commands/activate', (req, res) => 
    bannerController.activateBanner(req, res)
  );

  /**
   * Command: Deactivate banner (hide from home)
   * POST /api/banners/:id/commands/deactivate
   * 
   * Explicit intent: deactivate this banner
   */
  router.post('/:id/commands/deactivate', (req, res) => 
    bannerController.deactivateBanner(req, res)
  );

  /**
   * Command: Delete banner
   * DELETE /api/banners/:id
   * 
   * Removes banner completely from system
   */
  router.delete('/:id', (req, res) => bannerController.deleteBanner(req, res));

  /**
   * Query: Get all banners (including inactive)
   * GET /api/banners
   * 
   * Returns all banners, used by admin interface
   * May require admin authentication
   */
  router.get('/', (req, res) => bannerController.getAllBanners(req, res));

  return router;
};
