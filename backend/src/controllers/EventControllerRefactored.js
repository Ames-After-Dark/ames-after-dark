/**
 * Refactored Event Controller
 */

const {
  CreateEventDTO,
  EventResponseDTO,
} = require('../dtos');
const {
  InvalidEventError,
  AggregateNotFoundError,
} = require('../domain/errors');

class EventController {
  constructor(eventDomainService) {
    this.eventService = eventDomainService;
  }

  async createEvent(req, res) {
    try {
      const createEventDTO = CreateEventDTO.fromRequest(req.body);
      const event = await this.eventService.createEvent(createEventDTO);
      return res.status(201).json(new EventResponseDTO(event));
    } catch (error) {
      if (error.message.includes('Missing required fields')) {
        return res.status(400).json({ error: error.message });
      }
      if (error instanceof InvalidEventError) {
        return res.status(400).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getEventById(req, res) {
    try {
      const eventId = parseInt(req.params.id, 10);
      if (isNaN(eventId)) return res.status(400).json({ error: 'Invalid event ID' });

      const event = await this.eventService.getEventById(eventId);
      return res.json(new EventResponseDTO(event));
    } catch (error) {
      if (error instanceof AggregateNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getEventsByLocationId(req, res) {
    try {
      const locationId = req.params.locationId;
      if (!locationId) return res.status(400).json({ error: 'Location ID required' });

      const events = await this.eventService.getEventsByLocationId(locationId);
      return res.json(events.map(e => new EventResponseDTO(e)));
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getActiveEvents(req, res) {
    try {
      const events = await this.eventService.getActiveEvents();
      return res.json(events.map(e => new EventResponseDTO(e)));
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAllEvents(req, res) {
    try {
      const events = await this.eventService.getAllEvents();
      return res.json(events.map(e => new EventResponseDTO(e)));
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateEvent(req, res) {
    try {
      const eventId = parseInt(req.params.id, 10);
      if (isNaN(eventId)) return res.status(400).json({ error: 'Invalid event ID' });

      const updateEventDTO = CreateEventDTO.fromRequest(req.body);
      const event = await this.eventService.updateEvent(eventId, updateEventDTO);
      return res.json(new EventResponseDTO(event));
    } catch (error) {
      if (error instanceof AggregateNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof InvalidEventError) {
        return res.status(400).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async publishEvent(req, res) {
    try {
      const eventId = parseInt(req.params.id, 10);
      if (isNaN(eventId)) return res.status(400).json({ error: 'Invalid event ID' });

      const event = await this.eventService.publishEvent(eventId);
      return res.json(new EventResponseDTO(event));
    } catch (error) {
      if (error instanceof AggregateNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async unpublishEvent(req, res) {
    try {
      const eventId = parseInt(req.params.id, 10);
      if (isNaN(eventId)) return res.status(400).json({ error: 'Invalid event ID' });

      const event = await this.eventService.unpublishEvent(eventId);
      return res.json(new EventResponseDTO(event));
    } catch (error) {
      if (error instanceof AggregateNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteEvent(req, res) {
    try {
      const eventId = parseInt(req.params.id, 10);
      if (isNaN(eventId)) return res.status(400).json({ error: 'Invalid event ID' });

      await this.eventService.deleteEvent(eventId);
      return res.status(204).send();
    } catch (error) {
      if (error instanceof AggregateNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = EventController;
