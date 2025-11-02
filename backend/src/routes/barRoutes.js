const express = require('express');
const router = express.Router();
const barController = require('../controllers/barController');

// CRUD routes
router.get('/', barController.getBars);         // Read all
router.get('/:id', barController.getBarById);  // Read one
router.post('/', barController.createBar);     // Create
router.put('/:id', barController.updateBar);   // Update
router.delete('/:id', barController.deleteBar);// Delete

module.exports = router;
