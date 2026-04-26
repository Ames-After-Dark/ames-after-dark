const locationService = require('../services/locationService');
const userService = require('../services/userService');

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
    const authId = req.auth?.payload?.sub;
    if (!authId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userRoles = await userService.getUserRolesByAuth0Id(authId);
    if (!userRoles) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    const isDeveloper = userRoles.roles?.name?.toLowerCase() === 'developer';

    // For creation, they just need to be a developer or an admin (unattached to a location)
    if (!isDeveloper && !userRoles.isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    // Option A: strip unknown fields (mass-assignment defense)
    const {
      name,
      address,
      latitude,
      longitude,
      description,
      open,
      tags,
      nickname,
      location_type_id,
      zone_id,
      timezone,
    } = req.body || {};

    const createData = {
      ...(name !== undefined ? { name } : {}),
      ...(address !== undefined ? { address } : {}),
      ...(latitude !== undefined ? { latitude } : {}),
      ...(longitude !== undefined ? { longitude } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(open !== undefined ? { open } : {}),
      ...(tags !== undefined ? { tags } : {}),
      ...(nickname !== undefined ? { nickname } : {}),
      ...(location_type_id !== undefined ? { location_type_id } : {}),
      ...(zone_id !== undefined ? { zone_id } : {}),
      ...(timezone !== undefined ? { timezone } : {}),
    };

    const newLocation = await locationService.createLocation(createData);
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
    const authId = req.auth?.payload?.sub;
    if (!authId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userRoles = await userService.getUserRolesByAuth0Id(authId);
    if (!userRoles) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    const isDeveloper = userRoles.roles?.name?.toLowerCase() === 'developer';
    const isLocationAdmin = userRoles.location_admins?.some(la => la.location_id === id);

    if (!isDeveloper && (!userRoles.isAdmin || !isLocationAdmin)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    // Option A: strip unknown fields (mass-assignment defense)
    const {
      name,
      address,
      latitude,
      longitude,
      description,
      open,
      tags,
      nickname,
      location_type_id,
      zone_id,
      timezone,
    } = req.body || {};

    const updateData = {
      ...(name !== undefined ? { name } : {}),
      ...(address !== undefined ? { address } : {}),
      ...(latitude !== undefined ? { latitude } : {}),
      ...(longitude !== undefined ? { longitude } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(open !== undefined ? { open } : {}),
      ...(tags !== undefined ? { tags } : {}),
      ...(nickname !== undefined ? { nickname } : {}),
      ...(location_type_id !== undefined ? { location_type_id } : {}),
      ...(zone_id !== undefined ? { zone_id } : {}),
      ...(timezone !== undefined ? { timezone } : {}),
    };

    const updatedLocation = await locationService.updateLocation(id, updateData);
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
    const authId = req.auth?.payload?.sub;
    if (!authId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userRoles = await userService.getUserRolesByAuth0Id(authId);
    if (!userRoles) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    const isDeveloper = userRoles.roles?.name?.toLowerCase() === 'developer';
    const isLocationAdmin = userRoles.location_admins?.some(la => la.location_id === id);

    if (!isDeveloper && (!userRoles.isAdmin || !isLocationAdmin)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

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

// GET /api/locations/admin/:id
exports.getLocationsByAdminId = async (req, res) => {

  const authId = req.auth?.payload?.sub;
  if (!authId) {
    return res.status(401).json({ message: 'Missing authentication token' });
  }

  const user = await userService.getUserByAuth0Id(authId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  try {
    const locations = await locationService.getLocationsByAdminId(user.id);
    res.json(locations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/locations/developer/:id
exports.getLocationsByDeveloperId = async (req, res) => {

  const authId = req.auth?.payload?.sub;
  if (!authId) {
    return res.status(401).json({ message: 'Missing authentication token' });
  }

  const user = await userService.getUserByAuth0Id(authId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  try {
    const locations = await locationService.getLocationsByDeveloperId(user.id);
    res.json(locations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/locations/views/:id
exports.getTotalLocationViewsById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

  try {
    const views = await locationService.getTotalLocationViews(id);
    res.json(views);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/locations/:locationId/admins/:userId - Add admin to location
exports.addLocationAdmin = async (req, res) => {
  const locationId = parseInt(req.params.locationId, 10);
  const userId = parseInt(req.params.userId, 10);

  if (isNaN(locationId) || isNaN(userId)) {
    return res.status(400).json({ message: 'Invalid location ID or user ID' });
  }

  try {
    const authId = req.auth?.payload?.sub;
    if (!authId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const requestingUser = await userService.getUserRolesByAuth0Id(authId);
    if (!requestingUser) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    // Only developers can add location admins
    const isDeveloper = requestingUser.roles?.name?.toLowerCase() === 'developer';
    if (!isDeveloper) {
      return res.status(403).json({
        message: 'Forbidden: Only developers can add location admins'
      });
    }

    const locationAdmin = await locationService.addLocationAdmin(locationId, userId);
    res.status(201).json({
      message: 'Admin added to location successfully',
      data: locationAdmin
    });
  } catch (err) {
    console.error('Error adding location admin:', err);
    if (err.message === 'Location not found' || err.message === 'User not found') {
      return res.status(404).json({ message: err.message });
    }
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'User is already an admin for this location' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/locations/:locationId/admins/:userId - Remove admin from location
exports.removeLocationAdmin = async (req, res) => {
  const locationId = parseInt(req.params.locationId, 10);
  const userId = parseInt(req.params.userId, 10);

  if (isNaN(locationId) || isNaN(userId)) {
    return res.status(400).json({ message: 'Invalid location ID or user ID' });
  }

  try {
    const authId = req.auth?.payload?.sub;
    if (!authId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const requestingUser = await userService.getUserRolesByAuth0Id(authId);
    if (!requestingUser) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    // Only developers can remove location admins
    const isDeveloper = requestingUser.roles?.name?.toLowerCase() === 'developer';
    if (!isDeveloper) {
      return res.status(403).json({
        message: 'Forbidden: Only developers can remove location admins'
      });
    }

    await locationService.removeLocationAdmin(locationId, userId);
    res.json({ message: 'Admin removed from location successfully' });
  } catch (err) {
    console.error('Error removing location admin:', err);
    if (err.message === 'Location admin not found') {
      return res.status(404).json({ message: err.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};