const userSettingService = require('../services/userSettingService');
const userService = require('../services/userService');


exports.getUserSettings = async (req, res) => {
  try {
    const authId = req.auth?.payload?.sub;
    if (!authId) {
      return res.status(401).json({ message: 'Missing authentication token' });
    }

    const user = await userService.getUserByAuth0Id(authId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const settings = await userSettingService.getUserSettingsByUserId(user.id);
    if (!settings) return res.status(404).json({ message: 'Settings not found' });
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateUserSettings = async (req, res) => {
  try {
    const authId = req.auth?.payload?.sub;
    if (!authId) {
      return res.status(401).json({ message: 'Missing authentication token' });
    }

    const user = await userService.getUserByAuth0Id(authId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updated = await userSettingService.updateUserSettingsByUserId(user.id, req.body);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
