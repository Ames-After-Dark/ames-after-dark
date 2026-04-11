const userLocationService = require('../services/userLocationService');
const userService = require('../services/userService');

exports.getUserLocation = async (req, res) => {
  try {
    const authId = req.auth?.payload?.sub;
    if (!authId) {
      return res.status(401).json({ message: 'Missing authentication token' });
    }

    const user = await userService.getUserByAuth0Id(authId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const location = await userLocationService.getUserLocationByUserId(user.id);
    if (!location) return res.status(404).json({ message: 'Location not found' });
    res.json(location);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateUserLocation = async (req, res) => {
  try {
    const authId = req.auth?.payload?.sub;
    if (!authId) {
      return res.status(401).json({ message: 'Missing authentication token' });
    }

    const user = await userService.getUserByAuth0Id(authId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updated = await userLocationService.updateUserLocationByUserId(user.id, req.body);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getFriendsLocations = async (req, res) => {
  try {
    const authId = req.auth?.payload?.sub;
    if (!authId) {
      return res.status(401).json({ message: 'Missing authentication token' });
    }

    const user = await userService.getUserByAuth0Id(authId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const locations = await userLocationService.getFriendsLocations(user.id);
    res.json(locations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.toggleLocationPermission = async (req, res) => {
  try {
    const authId = req.auth?.payload?.sub;
    if (!authId) {
      return res.status(401).json({ message: 'Missing authentication token' });
    }

    const user = await userService.getUserByAuth0Id(authId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const viewerId = parseInt(req.params.viewerId);

    // Destructure value from the body
    const { enabled } = req.body;

    // Basic validation to ensure we have a boolean
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: "enabled (bool) is required." });
    }

    const result = await userLocationService.updatePermission(
      user.id,
      viewerId,
      enabled
    );

    res.status(200).json({
      success: true,
      message: enabled ? "Permission granted" : "Permission revoked"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.setGhostMode = async (req, res) => {
  try {
    const authId = req.auth?.payload?.sub;
    if (!authId) {
      return res.status(401).json({ message: 'Missing authentication token' });
    }

    const user = await userService.getUserByAuth0Id(authId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { hours } = req.body; // Expecting a number like 24, or 0 to turn off

    if (typeof hours !== 'number') return res.status(400).json({ message: 'Hours must be a number' });

    const result = await userLocationService.setGhostMode(user.id, hours);

    res.json({
      success: true,
      ghost_mode_expires_at: result.ghost_mode_expires_at,
      message: hours > 0 ? `Ghost mode enabled for ${hours} hours` : "Ghost mode disabled"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateSharingPreference = async (req, res) => {
  try {
    const authId = req.auth?.payload?.sub;
    if (!authId) {
      return res.status(401).json({ message: 'Missing authentication token' });
    }

    const user = await userService.getUserByAuth0Id(authId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { preference } = req.body; // 'PUBLIC', 'PRIVATE', or 'SELECTIVE'

    const validPrefs = ['PUBLIC', 'PRIVATE', 'SELECTIVE'];
    if (!validPrefs.includes(preference)) {
      return res.status(400).json({ message: 'Invalid preference value' });
    }

    const result = await userLocationService.updateSharingPreference(user.id, preference);

    res.json({
      success: true,
      preference: result.location_sharing_preference
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};