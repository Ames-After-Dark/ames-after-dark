const express = require('express');
const router = express.Router();
const userLocationController = require('../controllers/userLocationController');

// Get user location
router.get('/:userId', userLocationController.getUserLocation);
// Update user location
router.put('/:userId', userLocationController.updateUserLocation);

// Get friends' locations
router.get('/:userId/friends/locations', userLocationController.getFriendsLocations);

module.exports = router;
