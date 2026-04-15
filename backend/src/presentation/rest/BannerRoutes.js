const express = require('express');
const router = express.Router();

function createBannerRoutes(container) {
  const bannerService = container.getService('bannerApplicationService');

  router.get('/banners/:id', async (req, res) => {
    try {
      const banner = await bannerService.getBanner(req.params.id);
      res.json(banner);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  });

  router.get('/banners', async (req, res) => {
    try {
      const banners = await bannerService.getAllActiveBanners();
      res.json(banners);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/locations/:locationId/banners', async (req, res) => {
    try {
      const banners = await bannerService.getBannersByLocation(req.params.locationId);
      res.json(banners);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/banners', async (req, res) => {
    try {
      const { title, description, imageUrl, locationId, startDate, endDate } = req.body;
      const banner = await bannerService.createBanner({
        title,
        description,
        imageUrl,
        locationId,
        startDate,
        endDate,
      });
      res.status(201).json(banner);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.put('/banners/:id', async (req, res) => {
    try {
      const { title, description, imageUrl, startDate, endDate } = req.body;
      const banner = await bannerService.updateBanner(req.params.id, {
        title,
        description,
        imageUrl,
        startDate,
        endDate,
      });
      res.json(banner);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.delete('/banners/:id', async (req, res) => {
    try {
      await bannerService.deleteBanner(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createBannerRoutes;
