const express = require('express');
const router = express.Router();

function createMenuItemRoutes(container) {
  const menuItemService = container.getService('menuItemApplicationService');

  router.get('/menu-items/:id', async (req, res) => {
    try {
      const menuItem = await menuItemService.getMenuItem(req.params.id);
      res.json(menuItem);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  });

  router.get('/locations/:locationId/menu', async (req, res) => {
    try {
      const menuItems = await menuItemService.getMenuByLocation(req.params.locationId);
      res.json(menuItems);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/locations/:locationId/menu/category/:category', async (req, res) => {
    try {
      const menuItems = await menuItemService.getMenuItemsByCategory(
        req.params.locationId,
        req.params.category
      );
      res.json(menuItems);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/menu-items', async (req, res) => {
    try {
      const { name, description, price, category, locationId, imageUrl } = req.body;
      const menuItem = await menuItemService.createMenuItem({
        name,
        description,
        price,
        category,
        locationId,
        imageUrl,
      });
      res.status(201).json(menuItem);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.put('/menu-items/:id', async (req, res) => {
    try {
      const { name, description, price, category, imageUrl } = req.body;
      const menuItem = await menuItemService.updateMenuItem(req.params.id, {
        name,
        description,
        price,
        category,
        imageUrl,
      });
      res.json(menuItem);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.delete('/menu-items/:id', async (req, res) => {
    try {
      await menuItemService.removeMenuItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createMenuItemRoutes;
