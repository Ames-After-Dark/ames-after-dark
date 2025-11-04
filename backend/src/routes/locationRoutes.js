const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

// CRUD routes
router.get('/', locationController.getLocations);         // Read all
router.get('/:id', locationController.getLocationById);  // Read one
router.post('/', locationController.createLocation);     // Create
router.put('/:id', locationController.updateLocation);   // Update
router.delete('/:id', locationController.deleteLocation);// Delete

module.exports = router;
