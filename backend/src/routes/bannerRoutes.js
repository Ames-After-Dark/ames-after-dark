const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { checkJwt } = require('../middleware/authMiddleware');

// CRUD routes
router.post('/', checkJwt, bannerController.createBanner);
router.get('/active', bannerController.getActiveBanners);           // Read all active banners
router.get('/:id', bannerController.getBannerById);
router.post('/date-range', bannerController.getBannersByDateRange);            // Read banners by date range

module.exports = router;