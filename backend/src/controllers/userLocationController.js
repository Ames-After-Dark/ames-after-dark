const userLocationService = require('../services/userLocationService');
const userService = require('../services/userService');
const friendshipService = require('../services/friendshipService');

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

    const { latitude, longitude } = req.body || {};
    const updateData = {};
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;

    const updated = await userLocationService.updateUserLocationByUserId(user.id, updateData);
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
    if (isNaN(viewerId)) {
      return res.status(400).json({ message: 'Invalid viewerId' });
    }

    // Destructure value from the body
    const { enabled } = req.body;

    // Basic validation to ensure we have a boolean
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: "enabled (bool) is required." });
    }

    // Only allow selective sharing permissions to be modified for accepted friends.
    // Prevents granting location access to arbitrary user IDs.
    const friends = await friendshipService.getFriends(user.id);
    const isFriend = friends.some(f => f.id === viewerId);
    if (!isFriend) {
      return res.status(403).json({ message: 'Forbidden' });
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
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
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

// POST /api/locations/:locationId/checkin
exports.checkIn = async (req, res) => {
  try {

    const authId = req.auth?.payload?.sub;
    if (!authId) {
      return res.status(401).json({ message: 'Missing authentication token' });
    }

    const user = await userService.getUserByAuth0Id(authId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { locationId } = req.params;
    const { timezone } = req.body; // timezone: "America/Chicago"
    const userId = user.id;

    if (!userId || !locationId) {
      return res.status(400).json({ error: "userId and locationId are required." });
    }

    // Call the service we discussed
    const result = await userLocationService.processWeeklyCheckIn(
      parseInt(userId),
      parseInt(locationId),
      timezone
    );

    if (result.status === 'ALREADY_CHECKED_IN') {
      return res.status(200).json({
        message: "Streak has already been checked in for this week",
        streak: result.streak
      });
    }

    res.status(201).json({
      message: "Streak updated",
      streak: result.streak
    });

  } catch (error) {
    console.error("Check-in error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};