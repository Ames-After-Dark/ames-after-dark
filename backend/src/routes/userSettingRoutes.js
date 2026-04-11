const express = require('express');
const router = express.Router();
const userSettingController = require('../controllers/userSettingController');
const { checkJwt } = require('../middleware/authMiddleware');

// CRUD routes
router.get('/me', checkJwt, userSettingController.getUserSettings);
router.put('/me', checkJwt, userSettingController.updateUserSettings);

module.exports = router;
