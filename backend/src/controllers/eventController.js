const eventService = require('../services/eventService');
const userService = require('../services/userService');

// GET /api/events
exports.getEvents = async (req, res) => {
  try {
    const events = await eventService.getEvents();
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/events/:id
exports.getEventById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

  try {
    const event = await eventService.getEventById(id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/events
exports.createEvent = async (req, res) => {
  try {
    const authId = req.auth?.payload?.sub;
    if (!authId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { location_id } = req.body;
    if (!location_id) {
      return res.status(400).json({ error: "location_id is required" });
    }

    const userRoles = await userService.getUserRolesByAuth0Id(authId);
    if (!userRoles) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }

    const isDeveloper = userRoles.roles?.name?.toLowerCase() === 'developer';
    const isLocationAdmin = userRoles.location_admins?.some(la => la.location_id === Number(location_id));

    if (!isDeveloper && (!userRoles.isAdmin || !isLocationAdmin)) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }

    const { name, location_id: bodyLocationId, description, banner_id, occurrences } = req.body || {};
    const createData = {
      ...(name !== undefined ? { name } : {}),
      ...(bodyLocationId !== undefined ? { location_id: bodyLocationId } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(banner_id !== undefined ? { banner_id } : {}),
      ...(occurrences !== undefined ? { occurrences } : {}),
    };

    const event = await eventService.createEvent(createData);
    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /api/events/:id
exports.updateEvent = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

  try {
    const authId = req.auth?.payload?.sub;
    if (!authId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const existingEvent = await eventService.getEventById(id);
    if (!existingEvent) return res.status(404).json({ message: 'Event not found' });

    const location_id = req.body.location_id || existingEvent.location_id;

    const userRoles = await userService.getUserRolesByAuth0Id(authId);
    if (!userRoles) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }

    const isDeveloper = userRoles.roles?.name?.toLowerCase() === 'developer';
    const isLocationAdmin = userRoles.location_admins?.some(la => la.location_id === Number(location_id));

    if (!isDeveloper && (!userRoles.isAdmin || !isLocationAdmin)) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }

    const { name, location_id: body_location_id, description, banner_id, occurrences } = req.body || {};
    const updateData = {
      ...(name !== undefined ? { name } : {}),
      ...(body_location_id !== undefined ? { location_id: body_location_id } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(banner_id !== undefined ? { banner_id } : {}),
      ...(occurrences !== undefined ? { occurrences } : {}),
    };

    const event = await eventService.updateEvent(id, updateData);
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/events/:id
exports.deleteEvent = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

  try {
    const authId = req.auth?.payload?.sub;
    if (!authId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const existingEvent = await eventService.getEventById(id);
    if (!existingEvent) return res.status(404).json({ message: 'Event not found' });

    const userRoles = await userService.getUserRolesByAuth0Id(authId);
    if (!userRoles) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }

    const isDeveloper = userRoles.roles?.name?.toLowerCase() === 'developer';
    const isLocationAdmin = userRoles.location_admins?.some(la => la.location_id === Number(existingEvent.location_id));

    if (!isDeveloper && (!userRoles.isAdmin || !isLocationAdmin)) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }

    await eventService.deleteEvent(id);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getActiveEvents = async (req, res) => {
  try {
    const events = await eventService.getActiveEvents();
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getEventsByLocationId = async (req, res) => {
  const locationId = req.params.locationId;
  try {
    const events = await eventService.getEventsByLocationId(locationId);
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.createRecurringEvent = async (req, res) => {
  try {
    const authId = req.auth?.payload?.sub;
    if (!authId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const eventData = req.body;

    const userRoles = await userService.getUserRolesByAuth0Id(authId);
    if (!userRoles) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }

    const isDeveloper = userRoles.roles?.name?.toLowerCase() === 'developer';
    const isLocationAdmin = userRoles.location_admins?.some(la => la.location_id === Number(eventData.location_id));

    if (!isDeveloper && (!userRoles.isAdmin || !isLocationAdmin)) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }

    // Validate required fields
    const requiredFields = ['name', 'location_id', 'start_time', 'end_time', 'start_date', 'end_date', 'weekdays'];
    for (const field of requiredFields) {
      if (!eventData[field]) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    // Call service to create event + occurrences
    const result = await eventService.createRecurringEvent(eventData);

    return res.status(201).json({
      message: 'Recurring event created successfully',
      event: result.event,
      occurrences: result.occurrences
    });

  } catch (error) {
    console.error('Error creating recurring event:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};