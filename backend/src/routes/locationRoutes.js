const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

// GET open locations with optional query param ?utc=...
router.get('/open', locationController.getOpenLocations);
// Get locations with their hours included
router.get('/with-hours', locationController.getLocationsWithHours);

// CRUD routes
router.get('/', locationController.getLocations);         // Read all
router.get('/:id', locationController.getLocationById);  // Read one
router.post('/', locationController.createLocation);     // Create
router.put('/:id', locationController.updateLocation);   // Update
router.delete('/:id', locationController.deleteLocation);// Delete

module.exports = router;
