const { CreateEventDTO, UpdateEventDTO } = require('../application/dtos/EventDTO');
const { getServiceContainer } = require('../infrastructure/ServiceContainer');

class DDD_EventController {
  constructor() {
    this.eventService = getServiceContainer().getEventApplicationService();
  }

  async getAllEvents(req, res) {
    try {
      const events = await this.eventService.getAllEvents();
      res.json(events);
    } catch (err) {
      console.error('Error fetching events:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getEventById(req, res) {
    try {
      const { id } = req.params;
      const event = await this.eventService.getEventById(parseInt(id));
      res.json(event);
    } catch (err) {
      if (err.message.includes('not found')) {
        res.status(404).json({ message: err.message });
      } else {
        console.error('Error fetching event:', err);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  }

  async getEventsByLocation(req, res) {
    try {
      const { locationId } = req.params;
      const events = await this.eventService.getEventsByLocation(
        parseInt(locationId)
      );
      res.json(events);
    } catch (err) {
      console.error('Error fetching location events:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getUpcomingEvents(req, res) {
    try {
      const { days = 7 } = req.query;
      const events = await this.eventService.getUpcomingEvents(parseInt(days));
      res.json(events);
    } catch (err) {
      console.error('Error fetching upcoming events:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async createEvent(req, res) {
    try {
      const { title, description, startTime, endTime, locationId, imageUrl } =
        req.body;
      const dto = new CreateEventDTO(
        title,
        description,
        startTime,
        endTime,
        locationId,
        imageUrl
      );

      const event = await this.eventService.createEvent(dto);
      res.status(201).json(event);
    } catch (err) {
      if (err.message.includes('required') || err.message.includes('invalid')) {
        res.status(400).json({ message: err.message });
      } else {
        console.error('Error creating event:', err);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  }

  async updateEvent(req, res) {
    try {
      const { id } = req.params;
      const { title, description, startTime, endTime, imageUrl } = req.body;
      const dto = new UpdateEventDTO(
        title,
        description,
        startTime,
        endTime,
        imageUrl
      );

      const event = await this.eventService.updateEvent(parseInt(id), dto);
      res.json(event);
    } catch (err) {
      if (err.message.includes('not found')) {
        res.status(404).json({ message: err.message });
      } else if (
        err.message.includes('invalid') ||
        err.message.includes('cannot')
      ) {
        res.status(400).json({ message: err.message });
      } else {
        console.error('Error updating event:', err);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  }

  async deleteEvent(req, res) {
    try {
      const { id } = req.params;
      await this.eventService.deleteEvent(parseInt(id));
      res.status(204).send();
    } catch (err) {
      if (err.message.includes('not found')) {
        res.status(404).json({ message: err.message });
      } else {
        console.error('Error deleting event:', err);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  }

  async recordAttendee(req, res) {
    try {
      const { id } = req.params;
      const event = await this.eventService.recordAttendee(parseInt(id));
      res.json(event);
    } catch (err) {
      if (err.message.includes('not found')) {
        res.status(404).json({ message: err.message });
      } else {
        console.error('Error recording attendee:', err);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  }
}

module.exports = new DDD_EventController();
