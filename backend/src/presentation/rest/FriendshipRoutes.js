const express = require('express');
const router = express.Router();

function createFriendshipRoutes(container) {
  const friendshipService = container.getService('friendshipApplicationService');

  router.get('/friendships/pending/:userId', async (req, res) => {
    try {
      const pending = await friendshipService.getPendingRequests(req.params.userId);
      res.json(pending);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/friendships/accepted/:userId', async (req, res) => {
    try {
      const friends = await friendshipService.getFriends(req.params.userId);
      res.json(friends);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/friendships/request', async (req, res) => {
    try {
      const { userId1, userId2 } = req.body;
      const friendship = await friendshipService.requestFriendship(userId1, userId2);
      res.status(201).json(friendship);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.post('/friendships/:id/accept', async (req, res) => {
    try {
      const friendship = await friendshipService.acceptFriendship(req.params.id);
      res.json(friendship);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.delete('/friendships/:id', async (req, res) => {
    try {
      await friendshipService.removeFriendship(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createFriendshipRoutes;
