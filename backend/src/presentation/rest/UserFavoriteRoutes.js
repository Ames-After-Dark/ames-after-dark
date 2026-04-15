const express = require('express');
const router = express.Router();

function createUserFavoriteRoutes(container) {
  const userFavoriteService = container.getService('userFavoriteApplicationService');

  router.get('/user-favorites/:id', async (req, res) => {
    try {
      const userFavorite = await userFavoriteService.getUserFavorite(req.params.id);
      res.json(userFavorite);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  });

  router.get('/users/:userId/favorites', async (req, res) => {
    try {
      const favorites = await userFavoriteService.getUserFavorites(req.params.userId);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/locations/:locationId/favorite-count', async (req, res) => {
    try {
      const favorites = await userFavoriteService.getLocationFavorites(req.params.locationId);
      res.json({ count: favorites.length, favorited_by: favorites });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/users/:userId/locations/:locationId/favorite-status', async (req, res) => {
    try {
      const isFavorited = await userFavoriteService.isFavorited(req.params.userId, req.params.locationId);
      res.json({ isFavorited });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/user-favorites', async (req, res) => {
    try {
      const { userId, locationId } = req.body;
      const userFavorite = await userFavoriteService.addFavorite(userId, locationId);
      res.status(201).json(userFavorite);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.delete('/user-favorites/:id', async (req, res) => {
    try {
      await userFavoriteService.removeFavorite(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createUserFavoriteRoutes;
