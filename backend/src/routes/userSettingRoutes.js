const express = require('express');
const router = express.Router();
const userSettingController = require('../controllers/userSettingController');
const { checkJwt } = require('../middleware/authMiddleware');

// CRUD routes
router.get('/', checkJwt, userSettingController.getUserSettings);  // Read one
router.put('/', checkJwt, userSettingController.updateUserSettings);   // Update

module.exports = router;
