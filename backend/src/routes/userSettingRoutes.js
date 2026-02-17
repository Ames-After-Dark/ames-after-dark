const express = require('express');
const router = express.Router();
const userSettingController = require('../controllers/userSettingController');

// CRUD routes
router.get('/:userId', userSettingController.getUserSettings);  // Read one
router.put('/:userId', userSettingController.updateUserSettings);   // Update

module.exports = router;
