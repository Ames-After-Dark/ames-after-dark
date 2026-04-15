const express = require('express');
const router = express.Router();

function createUserSettingRoutes(container) {
  const userSettingService = container.getService('userSettingApplicationService');

  router.get('/users/:userId/settings', async (req, res) => {
    try {
      const settings = await userSettingService.getUserSettings(req.params.userId);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.put('/users/:userId/settings', async (req, res) => {
    try {
      const {
        notificationsEnabled,
        emailNotifications,
        pushNotifications,
        theme,
        privacy,
        locationSharing,
        preferredDistance,
      } = req.body;
      const settings = await userSettingService.updateSettings(req.params.userId, {
        notificationsEnabled,
        emailNotifications,
        pushNotifications,
        theme,
        privacy,
        locationSharing,
        preferredDistance,
      });
      res.json(settings);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.post('/users/:userId/settings/reset', async (req, res) => {
    try {
      const settings = await userSettingService.resetToDefaults(req.params.userId);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createUserSettingRoutes;
