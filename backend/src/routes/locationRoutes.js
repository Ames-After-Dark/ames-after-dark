const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { checkJwt, optionalJwt } = require('../middleware/authMiddleware');

// GET open locations with optional query param ?utc=...
router.get('/open', locationController.getOpenLocations);
// Get locations with their hours included
router.get('/with-hours', locationController.getLocationsWithHours);

router.get('/admin/:id',checkJwt, locationController.getLocationsByAdminId);

router.get('/developer/:id', checkJwt, locationController.getLocationsByDeveloperId);

router.get('/views/:id', locationController.getTotalLocationViewsById);

// CRUD routes
router.get('/', locationController.getLocations);         // Read all
router.get('/:id', locationController.getLocationById);  // Read one
router.post('/', locationController.createLocation);     // Create
router.put('/:id', locationController.updateLocation);   // Update
router.delete('/:id', locationController.deleteLocation);// Delete

module.exports = router;
