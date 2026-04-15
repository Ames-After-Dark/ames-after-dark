const express = require('express');
const router = express.Router();

function createDealRoutes(container) {
  const dealService = container.getService('dealApplicationService');

  router.get('/deals/:id', async (req, res) => {
    try {
      const deal = await dealService.getDeal(req.params.id);
      res.json(deal);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  });

  router.get('/deals', async (req, res) => {
    try {
      const deals = await dealService.getAllActiveDeals();
      res.json(deals);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/locations/:locationId/deals', async (req, res) => {
    try {
      const deals = await dealService.getDealsByLocation(req.params.locationId);
      res.json(deals);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/locations/:locationId/deals/active', async (req, res) => {
    try {
      const deals = await dealService.getActiveDealsByLocation(req.params.locationId);
      res.json(deals);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/deals', async (req, res) => {
    try {
      const { title, description, discount, code, locationId, startDate, endDate, category } = req.body;
      const deal = await dealService.createDeal({
        title,
        description,
        discount,
        code,
        locationId,
        startDate,
        endDate,
        category,
      });
      res.status(201).json(deal);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.put('/deals/:id', async (req, res) => {
    try {
      const { title, description, discount, code, startDate, endDate, category } = req.body;
      const deal = await dealService.updateDeal(req.params.id, {
        title,
        description,
        discount,
        code,
        startDate,
        endDate,
        category,
      });
      res.json(deal);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.delete('/deals/:id', async (req, res) => {
    try {
      await dealService.endDeal(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createDealRoutes;
