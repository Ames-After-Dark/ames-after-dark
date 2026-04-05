const userSettingService = require('../services/userSettingService');
const userService = require('../services/userService');


exports.getUserSettings = async (req, res) => {
  try {
    const auth0Id = req.auth?.payload?.sub || req.auth?.sub;
    if (!auth0Id) return res.status(401).json({ message: 'Unauthorized' });
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const userId = user.id;

    if (isNaN(userId)) return res.status(400).json({ message: 'Invalid userId' });
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
    const auth0Id = req.auth?.payload?.sub || req.auth?.sub;
    if (!auth0Id) return res.status(401).json({ message: 'Unauthorized' });
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const userId = user.id;

    if (isNaN(userId)) return res.status(400).json({ message: 'Invalid userId' });
    const updated = await userSettingService.updateUserSettingsByUserId(userId, req.body);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
