const userLocationService = require('../services/userLocationService');
const userService = require('../services/userService');

exports.getUserLocation = async (req, res) => {
  try {
    const auth0Id = req.auth?.payload?.sub || req.auth?.sub;
    if (!auth0Id) return res.status(401).json({ message: 'Unauthorized' });
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const userId = user.id;

    const location = await userLocationService.getUserLocationByUserId(userId);
    if (!location) return res.status(404).json({ message: 'Location not found' });
    res.json(location);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateUserLocation = async (req, res) => {
  try {
    const auth0Id = req.auth?.payload?.sub || req.auth?.sub;
    if (!auth0Id) return res.status(401).json({ message: 'Unauthorized' });
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const userId = user.id;

    const updated = await userLocationService.updateUserLocationByUserId(userId, req.body);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getFriendsLocations = async (req, res) => {
  try {
    const auth0Id = req.auth?.payload?.sub || req.auth?.sub;
    if (!auth0Id) return res.status(401).json({ message: 'Unauthorized' });
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const userId = user.id;

    const locations = await userLocationService.getFriendsLocations(userId);
    res.json(locations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.toggleLocationPermission = async (req, res) => {
  try {
    const viewerId = parseInt(req.params.viewerId);

    const auth0Id = req.auth?.payload?.sub || req.auth?.sub;
    if (!auth0Id) return res.status(401).json({ message: 'Unauthorized' });
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const ownerId = user.id;
    const { enabled } = req.body;

    // Basic validation to ensure we have numbers and booleans
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: "enabled (bool) is required." });
    }

    const result = await userLocationService.updatePermission(
      ownerId,
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
    const auth0Id = req.auth?.payload?.sub || req.auth?.sub;
    if (!auth0Id) return res.status(401).json({ message: 'Unauthorized' });
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const userId = user.id;

    const { hours } = req.body; // Expecting a number like 24, or 0 to turn off

    if (typeof hours !== 'number') return res.status(400).json({ message: 'Hours must be a number' });

    const result = await userLocationService.setGhostMode(userId, hours);

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
    const auth0Id = req.auth?.payload?.sub || req.auth?.sub;
    if (!auth0Id) return res.status(401).json({ message: 'Unauthorized' });
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const userId = user.id;

    const { preference } = req.body; // 'PUBLIC', 'PRIVATE', or 'SELECTIVE'

    if (isNaN(userId)) return res.status(400).json({ message: 'Invalid userId' });

    const validPrefs = ['PUBLIC', 'PRIVATE', 'SELECTIVE'];
    if (!validPrefs.includes(preference)) {
      return res.status(400).json({ message: 'Invalid preference value' });
    }

    const result = await userLocationService.updateSharingPreference(userId, preference);

    res.json({
      success: true,
      preference: result.location_sharing_preference
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};