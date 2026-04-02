const express = require('express');
const router = express.Router();
const userLocationController = require('../controllers/userLocationController');

// Get user location
router.get('/:userId', userLocationController.getUserLocation);
// Update user location
router.put('/:userId', userLocationController.updateUserLocation);

// Get friends' locations
router.get('/:userId/friends/locations', userLocationController.getFriendsLocations);

// Toggle location sharing for a specific friend
router.post('/permissions/:viewerId', userLocationController.toggleLocationPermission);

// Toggle Ghost Mode (POST with { hours: X } in body)
router.post('/:userId/ghost', userLocationController.setGhostMode);

// Update general sharing preference (PATCH with { preference: 'PUBLIC'|'PRIVATE'|'SELECTIVE' } in body)
router.patch('/:userId/preference', userLocationController.updateSharingPreference);

module.exports = router;
