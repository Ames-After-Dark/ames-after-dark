const express = require('express');
const router = express.Router();
const dealController = require('../controllers/dealController');

// This needs to be above get deals by id to avoid conflict
router.get('/active', dealController.getActiveDeals);
router.get('/location/:locationId', dealController.getDealsByLocationId);

// CRUD routes
router.get('/', dealController.getDeals);           // Read all
router.get('/:id', dealController.getDealById);     // Read one
router.post('/', dealController.createDeal);        // Create
router.put('/:id', dealController.updateDeal);      // Update
router.delete('/:id', dealController.deleteDeal);   // Delete

module.exports = router;