const userSettingService = require('../services/userSettingService');


exports.getUserSettings = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) return res.status(400).json({ message: 'Invalid userId' });
    const settings = await userSettingService.getUserSettingsByUserId(userId);
    if (!settings) return res.status(404).json({ message: 'Settings not found' });
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateUserSettings = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) return res.status(400).json({ message: 'Invalid userId' });
    const updated = await userSettingService.updateUserSettingsByUserId(userId, req.body);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
