const userLocationService = require('../services/userLocationService');

exports.getUserLocation = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) return res.status(400).json({ message: 'Invalid userId' });
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
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) return res.status(400).json({ message: 'Invalid userId' });
    const updated = await userLocationService.updateUserLocationByUserId(userId, req.body);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getFriendsLocations = async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) return res.status(400).json({ message: 'Invalid userId' });
  try {
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
    
    // Destructure both values from the body
    const { ownerId, enabled } = req.body; 

    // Basic validation to ensure we have numbers and booleans
    if (!ownerId || typeof enabled !== 'boolean') {
      return res.status(400).json({ error: "ownerId (int) and enabled (bool) are required." });
    }

    const result = await userLocationService.updatePermission(
      parseInt(ownerId), 
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
