const express = require('express');
const router = express.Router();
const dealController = require('../controllers/dealController');
const { checkJwt } = require('../middleware/authMiddleware');

// This needs to be above get deals by id to avoid conflict
router.get('/active', dealController.getActiveDeals);
router.get('/location/:locationId', dealController.getDealsByLocationId);
router.post('/recurring', checkJwt, dealController.createRecurringDeal);

// CRUD routes
router.get('/', dealController.getDeals);           // Read all
router.get('/:id', dealController.getDealById);     // Read one
router.post('/', checkJwt, dealController.createDeal);        // Create
router.put('/:id', checkJwt, dealController.updateDeal);      // Update
router.delete('/:id', checkJwt, dealController.deleteDeal);   // Delete

module.exports = router;