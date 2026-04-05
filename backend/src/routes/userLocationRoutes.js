const express = require('express');
const router = express.Router();
const userLocationController = require('../controllers/userLocationController');
const { checkJwt } = require('../middleware/authMiddleware');

// Get user location
router.get('/', checkJwt, userLocationController.getUserLocation);
// Update user location
router.put('/', checkJwt, userLocationController.updateUserLocation);

// Get friends' locations
router.get('/friends/locations', checkJwt, userLocationController.getFriendsLocations);

// Toggle location sharing for a specific friend
router.post('/permissions/:viewerId', checkJwt, userLocationController.toggleLocationPermission);

// Toggle Ghost Mode (POST with { hours: X } in body)
router.post('/ghost', checkJwt, userLocationController.setGhostMode);

// Update general sharing preference (PATCH with { preference: 'PUBLIC'|'PRIVATE'|'SELECTIVE' } in body)
router.patch('/preference', checkJwt, userLocationController.updateSharingPreference);

module.exports = router;
