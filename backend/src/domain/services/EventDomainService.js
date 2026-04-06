/**
 * Domain Service - Event Management
 */

const { Event } = require('../entities');
const { EntityIds } = require('../valueObjects');
const { AggregateNotFoundError, InvalidEventError } = require('../errors');

class EventDomainService {
  constructor(eventRepository) {
    this.eventRepository = eventRepository;
  }

  async createEvent(command) {
    try {
      const event = new Event(
        null,
        command.title,
        command.description,
        command.locationId ? EntityIds.locationId(command.locationId) : null
      );

      if (command.occurrences && Array.isArray(command.occurrences)) {
        command.occurrences.forEach(o => {
          event.addOccurrence(o.startDate, o.endDate);
        });
      }

      return this.eventRepository.save(event);
    } catch (error) {
      if (error.message.includes('Event')) {
        throw new InvalidEventError(error.message);
      }
      throw error;
    }
  }

  async getEventById(eventId) {
    const id = EntityIds.eventId(eventId);
    const event = await this.eventRepository.findById(id);
    
    if (!event) {
      throw new AggregateNotFoundError('Event', id.value);
    }
    return event;
  }

  async getEventsByLocationId(locationId) {
    const id = EntityIds.locationId(locationId);
    return this.eventRepository.findByLocationId(id);
  }

  async getActiveEvents(now = new Date()) {
    const events = await this.eventRepository.findAll();
    return events.filter(e => e.hasActiveOccurrence(now));
  }

  async getAllEvents() {
    return this.eventRepository.findAll();
  }

  async updateEvent(eventId, command) {
    const id = EntityIds.eventId(eventId);
    const event = await this.eventRepository.findById(id);
    
    if (!event) {
      throw new AggregateNotFoundError('Event', id.value);
    }

    try {
      if (command.title) event.title = command.title;
      if (command.description) event.description = command.description;
      
      if (command.occurrences && Array.isArray(command.occurrences)) {
        event.replaceOccurrences(command.occurrences);
      }

      return this.eventRepository.save(event);
    } catch (error) {
      throw new InvalidEventError(error.message);
    }
  }

  async publishEvent(eventId) {
    const id = EntityIds.eventId(eventId);
    const event = await this.eventRepository.findById(id);
    
    if (!event) {
      throw new AggregateNotFoundError('Event', id.value);
    }

    event.activate();
    return this.eventRepository.save(event);
  }

  async unpublishEvent(eventId) {
    const id = EntityIds.eventId(eventId);
    const event = await this.eventRepository.findById(id);
    
    if (!event) {
      throw new AggregateNotFoundError('Event', id.value);
    }

    event.deactivate();
    return this.eventRepository.save(event);
  }

  async deleteEvent(eventId) {
    const id = EntityIds.eventId(eventId);
    const event = await this.eventRepository.findById(id);
    
    if (!event) {
      throw new AggregateNotFoundError('Event', id.value);
    }

    return this.eventRepository.delete(id);
  }
}

module.exports = EventDomainService;
