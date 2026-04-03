const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');

// CRUD routes
router.post('/', bannerController.createBanner);
router.get('/active', bannerController.getActiveBanners);           // Read all active banners
router.get('/:id', bannerController.getBannerById);


module.exports = router;