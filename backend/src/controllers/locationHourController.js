const locationHoursService = require('../services/locationHoursService');
const userService = require('../services/userService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * GET /api/location-hours/:locationId
 * Fetches the full schedule + active overrides for a specific location
 */
exports.getHoursByLocationId = async (req, res) => {
  const locationId = parseInt(req.params.locationId, 10);

  if (isNaN(locationId)) {
    return res.status(400).json({ message: 'Invalid Location ID' });
  }

  try {
    const data = await locationHoursService.getHoursByLocationId(locationId);

    if (!data) {
      return res.status(404).json({ message: 'Location not found' });
    }

    res.json(data);
  } catch (err) {
    console.error(`Error fetching hours for location ${locationId}:`, err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * PUT /api/location-hours/:locationId/weekly
 * Replaces the recurring Mon-Sun schedule
 */
exports.updateWeeklyHours = async (req, res) => {
  const locationId = parseInt(req.params.locationId, 10);
  const { hours } = req.body; // Expects array of { weekday_id, open_time, close_time }

  if (isNaN(locationId) || !Array.isArray(hours)) {
    return res.status(400).json({ message: 'Invalid Location ID or hours format' });
  }

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
    const isLocationAdmin = userRoles.location_admins?.some(la => la.location_id === locationId);

    if (!isDeveloper && (!userRoles.isAdmin || !isLocationAdmin)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    await locationHoursService.updateWeeklyHours(locationId, hours);
    res.json({ message: 'Weekly schedule updated successfully' });
  } catch (err) {
    console.error(`Error updating weekly hours for ${locationId}:`, err);
    res.status(500).json({ message: 'Failed to update weekly schedule' });
  }
};

/**
 * POST /api/location-hours/:locationId/overrides
 * Adds a one-time override (holiday, emergency, etc.)
 */
exports.createOverride = async (req, res) => {
  const locationId = parseInt(req.params.locationId, 10);

  if (isNaN(locationId)) {
    return res.status(400).json({ message: 'Invalid Location ID' });
  }

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
    const isLocationAdmin = userRoles.location_admins?.some(la => la.location_id === locationId);

    if (!isDeveloper && (!userRoles.isAdmin || !isLocationAdmin)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    // Option A: strip unknown fields (mass-assignment defense)
    const {
      start_time_utc,
      end_time_utc,
      reason,
      is_open,
    } = req.body || {};

    const overrideData = {
      ...(start_time_utc !== undefined ? { start_time_utc } : {}),
      ...(end_time_utc !== undefined ? { end_time_utc } : {}),
      ...(reason !== undefined ? { reason } : {}),
      ...(is_open !== undefined ? { is_open } : {}),
    };

    const override = await locationHoursService.createOverride(locationId, overrideData);
    res.status(201).json(override);
  } catch (err) {
    console.error(`Error creating override for ${locationId}:`, err);
    res.status(500).json({ message: 'Failed to create hours override' });
  }
};

/**
 * DELETE /api/location-hours/overrides/:overrideId
 * Removes a specific override record
 */
exports.deleteOverride = async (req, res) => {
  const overrideId = parseInt(req.params.overrideId, 10);

  if (isNaN(overrideId)) {
    return res.status(400).json({ message: 'Invalid Override ID' });
  }

  try {
    const overrideRecord = await prisma.location_hours_overrides.findUnique({
      where: { id: overrideId },
      select: { location_id: true }
    });

    if (!overrideRecord) {
      return res.status(404).json({ message: 'Override not found' });
    }

    const locationId = overrideRecord.location_id;

    const authId = req.auth?.payload?.sub;
    if (!authId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userRoles = await userService.getUserRolesByAuth0Id(authId);
    if (!userRoles) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    const isDeveloper = userRoles.roles?.name?.toLowerCase() === 'developer';
    const isLocationAdmin = userRoles.location_admins?.some(la => la.location_id === locationId);

    if (!isDeveloper && (!userRoles.isAdmin || !isLocationAdmin)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    await locationHoursService.deleteOverride(overrideId);
    res.json({ message: 'Override removed successfully' });
  } catch (err) {
    console.error(`Error deleting override ${overrideId}:`, err);
    res.status(500).json({ message: 'Failed to delete override' });
  }
};