const locationHoursService = require('../services/locationHoursService');

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
    const override = await locationHoursService.createOverride(locationId, req.body);
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
    await locationHoursService.deleteOverride(overrideId);
    res.json({ message: 'Override removed successfully' });
  } catch (err) {
    console.error(`Error deleting override ${overrideId}:`, err);
    res.status(500).json({ message: 'Failed to delete override' });
  }
};