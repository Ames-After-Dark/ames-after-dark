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

    const { sms_notifications, timezone, location_sharing_preference, ghost_mode_expires_at } = req.body || {};
    const updateData = {};
    if (sms_notifications !== undefined) updateData.sms_notifications = sms_notifications;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (location_sharing_preference !== undefined) updateData.location_sharing_preference = location_sharing_preference;
    if (ghost_mode_expires_at !== undefined) updateData.ghost_mode_expires_at = ghost_mode_expires_at;

    const updated = await userSettingService.updateUserSettingsByUserId(user.id, updateData);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
