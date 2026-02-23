const locationService = require('../services/locationService');

// GET /api/locations
exports.getLocations = async (req, res) => {
  try {
    const locations = await locationService.getLocations();
    res.json(locations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/locations/:id
exports.getLocationById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

  try {
    const location = await locationService.getLocationById(id);
    if (!location) return res.status(404).json({ message: 'Location not found' });
    res.json(location);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/locations
exports.createLocation = async (req, res) => {
  try {
    const newLocation = await locationService.createLocation(req.body);
    res.status(201).json(newLocation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /api/locations/:id
exports.updateLocation = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

  try {
    const updatedLocation = await locationService.updateLocation(id, req.body);
    if (!updatedLocation) return res.status(404).json({ message: 'Location not found' });
    res.json(updatedLocation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/locations/:id
exports.deleteLocation = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

  try {
    const deletedLocation = await locationService.deleteLocation(id);
    if (!deletedLocation) return res.status(404).json({ message: 'Location not found' });
    res.json(deletedLocation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getOpenLocations = async (req, res) => {
  try {
    // Get UTC from query parameter, fallback to current UTC if not provided
    const currentUtc = req.query.utc ? new Date(req.query.utc) : new Date();
    
    const locations = await locationService.getOpenLocations(currentUtc);
    res.json(locations);
  } catch (err) {
    console.error('Error fetching open locations:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/locations-with-hours
exports.getLocationsWithHours = async (req, res) => {
  try {
    const locations = await locationService.getLocationsWithHours();
    res.json(locations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};