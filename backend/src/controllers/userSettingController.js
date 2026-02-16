// PUT /api/userSettings/:userId
exports.updateUserSettings = async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) return res.status(400).json({ message: 'Invalid user ID' });

  try {
    const updated = await userSettingService.updateUserSettingsByUserId(userId, req.body);
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'User Settings not found' });
    }
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const userSettingService = require('../services/userSettingService.js');


// GET /api/userSettings/:userId
exports.getUserSettings = async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) return res.status(400).json({ message: 'Invalid user ID' });

  try {
    const settings = await userSettingService.getUserSettingsByUserId(userId);
    if (!settings) return res.status(404).json({ message: 'User Settings not found' });
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
