const eventService = require('../services/eventService');

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
    const event = await eventService.createEvent(req.body);
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
    const event = await eventService.updateEvent(id, req.body);
    if (!event) return res.status(404).json({ message: 'Event not found' });
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
    const eventData = req.body;

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