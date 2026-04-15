const Event = require('../../domain/entities/Event');
const { EventResponseDTO } = require('../dtos/EventDTO');

class EventApplicationService {
  constructor(eventRepository, eventPublisher) {
    this.eventRepository = eventRepository;
    this.eventPublisher = eventPublisher;
  }

  async getAllEvents() {
    const events = await this.eventRepository.findAll();
    return events.map(e => EventResponseDTO.fromDomain(e));
  }

  async getEventById(id) {
    const event = await this.eventRepository.findById(id);
    if (!event) {
      throw new Error(`Event ${id} not found`);
    }
    return EventResponseDTO.fromDomain(event);
  }

  async getEventsByLocation(locationId) {
    const events = await this.eventRepository.findByLocationId(locationId);
    return events.map(e => EventResponseDTO.fromDomain(e));
  }

  async getUpcomingEvents(days = 7) {
    const events = await this.eventRepository.findUpcoming(days);
    return events.map(e => EventResponseDTO.fromDomain(e));
  }

  async createEvent(dto) {
    dto.validate();

    const event = Event.create(
      null,
      dto.title,
      dto.description,
      dto.startTime,
      dto.endTime,
      dto.locationId,
      { imageUrl: dto.imageUrl }
    );

    const saved = await this.eventRepository.save(event);

    saved.getUncommittedEvents().forEach(event => {
      this.eventPublisher.publish(event);
    });

    return EventResponseDTO.fromDomain(saved);
  }

  async updateEvent(id, dto) {
    dto.validate();

    const event = await this.eventRepository.findById(id);
    if (!event) {
      throw new Error(`Event ${id} not found`);
    }

    event.updateDetails(
      dto.title ?? event.title,
      dto.description ?? event.description,
      dto.startTime ?? event.startTime,
      dto.endTime ?? event.endTime
    );

    const saved = await this.eventRepository.save(event);

    saved.getUncommittedEvents().forEach(evt => {
      this.eventPublisher.publish(evt);
    });

    return EventResponseDTO.fromDomain(saved);
  }

  async deleteEvent(id) {
    const event = await this.eventRepository.findById(id);
    if (!event) {
      throw new Error(`Event ${id} not found`);
    }
    await this.eventRepository.delete(id);
  }

  async recordAttendee(eventId) {
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new Error(`Event ${eventId} not found`);
    }

    event.recordAttendee();
    const saved = await this.eventRepository.save(event);

    saved.getUncommittedEvents().forEach(evt => {
      this.eventPublisher.publish(evt);
    });

    return EventResponseDTO.fromDomain(saved);
  }
}

module.exports = EventApplicationService;
