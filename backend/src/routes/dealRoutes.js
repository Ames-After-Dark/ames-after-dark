const express = require('express');
const router = express.Router();
const dealController = require('../controllers/dealController');

// CRUD routes
router.get('/', dealController.getDeals);           // Read all
router.get('/:id', dealController.getDealById);     // Read one
router.post('/', dealController.createDeal);        // Create
router.put('/:id', dealController.updateDeal);      // Update
router.delete('/:id', dealController.deleteDeal);   // Delete

module.exports = router;