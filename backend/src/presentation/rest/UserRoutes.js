const express = require('express');
const router = express.Router();

function createUserRoutes(container) {
  const userService = container.getService('userApplicationService');

  router.get('/users/:id', async (req, res) => {
    try {
      const user = await userService.getUser(req.params.id);
      res.json(user);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  });

  router.get('/users', async (req, res) => {
    try {
      const users = await userService.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/users', async (req, res) => {
    try {
      const { email, displayName, firstName, lastName, avatar } = req.body;
      const user = await userService.createUser({
        email,
        displayName,
        firstName,
        lastName,
        avatar,
      });
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.put('/users/:id', async (req, res) => {
    try {
      const { displayName, firstName, lastName, avatar } = req.body;
      const user = await userService.updateUser(req.params.id, {
        displayName,
        firstName,
        lastName,
        avatar,
      });
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.delete('/users/:id', async (req, res) => {
    try {
      await userService.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createUserRoutes;
