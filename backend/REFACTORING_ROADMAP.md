# DDD Refactoring Roadmap - Step-by-Step Instructions

## Overview

This document provides step-by-step instructions for refactoring each controller from the legacy architecture to the new DDD-based architecture.

## Architecture Reference

```
┌─────────────────────────────────────────────────────────┐
│  Express Routes (bannerRoutes.js, dealRoutes.js, etc.)   │ Presentation Layer
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Controllers (DDD-*Controller.js)                        │ Presentation Layer
│  - Parse requests                                        │
│  - Validate using DTOs                                   │
│  - Call application services                             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Application Services (*ApplicationService.js)           │ Application Layer
│  - Orchestrate use cases                                 │
│  - Coordinate repositories                               │
│  - Publish events                                        │
│  - Return DTOs                                           │
└─────────────────────────────────────────────────────────┘
                          ↓
             ┌────────────────────────────┐
             │                            │
     ┌─────────────────────┐    ┌─────────────────────────┐
     │  Repositories       │    │  Event Publisher        │
     │  - Find entities    │    │  - Publish domain events│
     │  - Save aggregates  │    │  - Subscribe to events  │
     └─────────────────────┘    └─────────────────────────┘
             ↓                           ↓
     ┌─────────────────────┐    ┌─────────────────────────┐
     │  Aggregate Roots    │    │  Domain Events          │
     │  + Value Objects    │    │  - Event definitions    │
     │  - Domain logic     │    │  - Event subscribers    │
     └─────────────────────┘    └─────────────────────────┘
             ↓ 
     ┌─────────────────────┐
     │  Prisma            │
     │  Database          │
     └─────────────────────┘
```

## Refactoring Steps for Each Controller

### Step 1: Create the Aggregate (Domain Layer)

For each domain (e.g., Event, Deal, Banner), create an aggregate root:

```bash
# Create domain files for Event domain
src/domain/entities/Event.js           # Aggregate root
src/domain/events/EventEvents.js       # Domain events
src/domain/repositories/IEventRepository.js  # Repository interface
```

**Example: Event Aggregate**

```javascript
// src/domain/entities/Event.js
const AggregateRoot = require('../../shared/AggregateRoot');
const EventCreatedEvent = require('../events/EventEvents').EventCreatedEvent;

class Event extends AggregateRoot {
  constructor(id, title, description, startTime, endTime, locationId, props = {}) {
    super(id);
    this.title = title;
    this.description = description;
    this.startTime = startTime;
    this.endTime = endTime;
    this.locationId = locationId;
    this.attendeeCount = props.attendeeCount ?? 0;
    this.imageUrl = props.imageUrl;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  static create(id, title, description, startTime, endTime, locationId, props = {}) {
    const event = new Event(id, title, description, startTime, endTime, locationId, props);
    event.publishEvent(new EventCreatedEvent(id, title, locationId));
    return event;
  }

  recordAttendee() {
    this.attendeeCount += 1;
    this.publishEvent(new EventAttendeeAddedEvent(this.id));
  }

  updateDetails(title, description, startTime, endTime) {
    this.title = title;
    this.description = description;
    this.startTime = startTime;
    this.endTime = endTime;
    this.publishEvent(new EventUpdatedEvent(this.id, title));
  }

  toObject() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      startTime: this.startTime,
      endTime: this.endTime,
      locationId: this.locationId,
      attendeeCount: this.attendeeCount,
      imageUrl: this.imageUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Event;
```

### Step 2: Create Value Objects (Domain Layer)

If specific attributes need validation:

```javascript
// src/domain/value-objects/EventTime.js - If time range validation needed
const BaseValueObject = require('../../shared/BaseValueObject');

class EventTime extends BaseValueObject {
  constructor(startTime, endTime) {
    super();
    if (!this.isValidTime(startTime)) {
      throw new Error('Invalid start time format');
    }
    if (!this.isValidTime(endTime)) {
      throw new Error('Invalid end time format');
    }
    if (new Date(endTime) <= new Date(startTime)) {
      throw new Error('End time must be after start time');
    }
    this.startTime = startTime;
    this.endTime = endTime;
  }

  isValidTime(time) {
    return time instanceof Date || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(time);
  }

  getDurationMinutes() {
    return (new Date(this.endTime) - new Date(this.startTime)) / 60000;
  }

  getEqualityComponents() {
    return [this.startTime, this.endTime];
  }
}

module.exports = EventTime;
```

### Step 3: Create Domain Events (Domain Layer)

```javascript
// src/domain/events/EventEvents.js
const DomainEvent = require('../../shared/DomainEvent');

class EventCreatedEvent extends DomainEvent {
  constructor(eventId, title, locationId) {
    super('EventCreatedEvent');
    this.eventId = eventId;
    this.title = title;
    this.locationId = locationId;
    this.occurredAt = new Date();
  }
}

class EventUpdatedEvent extends DomainEvent {
  constructor(eventId, title) {
    super('EventUpdatedEvent');
    this.eventId = eventId;
    this.title = title;
    this.occurredAt = new Date();
  }
}

class EventAttendeeAddedEvent extends DomainEvent {
  constructor(eventId) {
    super('EventAttendeeAddedEvent');
    this.eventId = eventId;
    this.occurredAt = new Date();
  }
}

module.exports = {
  EventCreatedEvent,
  EventUpdatedEvent,
  EventAttendeeAddedEvent
};
```

### Step 4: Create Repository Interface (Domain Layer)

```javascript
// src/domain/repositories/IEventRepository.js
class IEventRepository {
  async findById(id) {
    throw new Error('Not implemented');
  }

  async findByLocationId(locationId) {
    throw new Error('Not implemented');
  }

  async findUpcoming(days = 7) {
    throw new Error('Not implemented');
  }

  async findAll() {
    throw new Error('Not implemented');
  }

  async save(event) {
    throw new Error('Not implemented');
  }

  async delete(id) {
    throw new Error('Not implemented');
  }
}

module.exports = IEventRepository;
```

### Step 5: Create Prisma Repository Implementation (Infrastructure Layer)

```javascript
// src/infrastructure/repositories/PrismaEventRepository.js
const IEventRepository = require('../../domain/repositories/IEventRepository');
const Event = require('../../domain/entities/Event');
const prisma = require('../../db');

class PrismaEventRepository extends IEventRepository {
  async findById(id) {
    const raw = await prisma.events.findUnique({
      where: { id }
    });
    return raw ? this.toDomain(raw) : null;
  }

  async findByLocationId(locationId) {
    const raw = await prisma.events.findMany({
      where: { location_id: locationId },
      orderBy: { start_time: 'asc' }
    });
    return raw.map(r => this.toDomain(r));
  }

  async findUpcoming(days = 7) {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    const raw = await prisma.events.findMany({
      where: {
        start_time: {
          gte: now,
          lte: futureDate
        }
      },
      orderBy: { start_time: 'asc' }
    });
    return raw.map(r => this.toDomain(r));
  }

  async findAll() {
    const raw = await prisma.events.findMany({
      orderBy: { created_at: 'desc' }
    });
    return raw.map(r => this.toDomain(r));
  }

  async save(event) {
    const exists = await prisma.events.findUnique({
      where: { id: event.id }
    });

    const data = this.toPersistence(event);

    if (exists) {
      return this.toDomain(
        await prisma.events.update({
          where: { id: event.id },
          data
        })
      );
    } else {
      return this.toDomain(
        await prisma.events.create({ data })
      );
    }
  }

  async delete(id) {
    await prisma.events.delete({
      where: { id }
    });
  }

  toDomain(raw) {
    return new Event(
      raw.id,
      raw.title,
      raw.description,
      raw.start_time,
      raw.end_time,
      raw.location_id,
      {
        attendeeCount: raw.attendee_count,
        imageUrl: raw.image_url,
        createdAt: raw.created_at,
        updatedAt: raw.updated_at
      }
    );
  }

  toPersistence(domain) {
    const obj = domain.toObject();
    return {
      title: obj.title,
      description: obj.description,
      start_time: obj.startTime,
      end_time: obj.endTime,
      location_id: obj.locationId,
      attendee_count: obj.attendeeCount,
      image_url: obj.imageUrl,
      updated_at: new Date()
    };
  }
}

module.exports = PrismaEventRepository;
```

### Step 6: Create DTOs (Application Layer)

```javascript
// src/application/dtos/EventDTO.js
class CreateEventDTO {
  constructor(title, description, startTime, endTime, locationId, imageUrl) {
    this.title = title;
    this.description = description;
    this.startTime = startTime;
    this.endTime = endTime;
    this.locationId = locationId;
    this.imageUrl = imageUrl;
  }

  validate() {
    if (!this.title || this.title.trim().length === 0) {
      throw new Error('Event title is required');
    }
    if (!this.locationId) {
      throw new Error('Location ID is required');
    }
    if (!this.startTime || !this.endTime) {
      throw new Error('Start and end times are required');
    }
    if (new Date(this.endTime) <= new Date(this.startTime)) {
      throw new Error('End time must be after start time');
    }
  }
}

class UpdateEventDTO {
  constructor(title, description, startTime, endTime, imageUrl) {
    this.title = title;
    this.description = description;
    this.startTime = startTime;
    this.endTime = endTime;
    this.imageUrl = imageUrl;
  }

  validate() {
    if (this.title !== undefined && this.title.trim().length === 0) {
      throw new Error('Event title cannot be empty');
    }
    if (this.startTime && this.endTime && new Date(this.endTime) <= new Date(this.startTime)) {
      throw new Error('End time must be after start time');
    }
  }
}

class EventResponseDTO {
  static fromDomain(event) {
    const obj = event.toObject();
    return {
      id: obj.id,
      title: obj.title,
      description: obj.description,
      startTime: obj.startTime,
      endTime: obj.endTime,
      locationId: obj.locationId,
      attendeeCount: obj.attendeeCount,
      imageUrl: obj.imageUrl,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt
    };
  }
}

module.exports = {
  CreateEventDTO,
  UpdateEventDTO,
  EventResponseDTO
};
```

### Step 7: Create Application Service (Application Layer)

```javascript
// src/application/services/EventApplicationService.js
const Event = require('../../domain/entities/Event');

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
    
    // Publish domain events
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
    
    saved.getUncommittedEvents().forEach(event => {
      this.eventPublisher.publish(event);
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
```

### Step 8: Refactor Controller (Presentation Layer)

```javascript
// src/controllers/DDD-EventController.js
const { CreateEventDTO, UpdateEventDTO, EventResponseDTO } = require('../application/dtos/EventDTO');
const getServiceContainer = require('../infrastructure/ServiceContainer');

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
      const events = await this.eventService.getEventsByLocation(parseInt(locationId));
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
      const { title, description, startTime, endTime, locationId, imageUrl } = req.body;
      const dto = new CreateEventDTO(title, description, startTime, endTime, locationId, imageUrl);
      
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
      const dto = new UpdateEventDTO(title, description, startTime, endTime, imageUrl);
      
      const event = await this.eventService.updateEvent(parseInt(id), dto);
      res.json(event);
    } catch (err) {
      if (err.message.includes('not found')) {
        res.status(404).json({ message: err.message });
      } else if (err.message.includes('invalid') || err.message.includes('cannot')) {
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
```

### Step 9: Update ServiceContainer

```javascript
// In src/infrastructure/ServiceContainer.js - add to getInstance()
const EventApplicationService = require('../application/services/EventApplicationService');
const PrismaEventRepository = require('./repositories/PrismaEventRepository');

// In class definition:
this.eventRepository = new PrismaEventRepository();
this.eventApplicationService = new EventApplicationService(
  this.eventRepository,
  this.eventPublisher
);

getEventApplicationService() {
  return this.eventApplicationService;
}
```

### Step 10: Update Routes

```javascript
// src/routes/eventRoutes.js
const router = require('express').Router();
const controller = require('../controllers/DDD-EventController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/', controller.getAllEvents.bind(controller));
router.get('/upcoming', controller.getUpcomingEvents.bind(controller));
router.get('/:id', controller.getEventById.bind(controller));
router.get('/location/:locationId', controller.getEventsByLocation.bind(controller));
router.post('/', authenticate, controller.createEvent.bind(controller));
router.put('/:id', authenticate, controller.updateEvent.bind(controller));
router.delete('/:id', authenticate, controller.deleteEvent.bind(controller));
router.post('/:id/attendees', authenticate, controller.recordAttendee.bind(controller));

module.exports = router;
```

## Implementation Order (Recommended)

1. **Location** ✅ Done
2. **User** ✅ Done
3. **Event** - 3 hours
4. **Deal** - 2 hours
5. **Friendship** - 2 hours
6. **Banner** - 1 hour
7. **UserLocation** - 1 hour
8. **MenuItem** - 1 hour
9. **LocationHour** - 1 hour
10. **UserSetting** - 1 hour
11. **UserFavorite** - 1 hour

## Checklist for Each Domain

For each domain (Event, Deal, Friendship, etc.):

- [ ] Create aggregate root (`src/domain/entities/*.js`)
- [ ] Create domain events (`src/domain/events/*Events.js`)
- [ ] Create repository interface (`src/domain/repositories/I*Repository.js`)
- [ ] Create Prisma repository (`src/infrastructure/repositories/Prisma*Repository.js`)
- [ ] Create DTOs (`src/application/dtos/*DTO.js`)
- [ ] Create application service (`src/application/services/*ApplicationService.js`)
- [ ] Create DDD controller (`src/controllers/DDD-*Controller.js`)
- [ ] Update ServiceContainer
- [ ] Update routes to use new controller
- [ ] Test all endpoints
- [ ] Update documentation

## Common Patterns

### Error Handling Pattern
```javascript
} catch (err) {
  if (err.message.includes('not found')) {
    res.status(404).json({ message: err.message });
  } else if (err.message.includes('required') || err.message.includes('invalid')) {
    res.status(400).json({ message: err.message });
  } else {
    console.error('Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}
```

### Repository Pattern
```javascript
// Save single aggregate
async save(aggregate) {
  const exists = await prisma.table.findUnique({ where: { id: aggregate.id } });
  if (exists) {
    return this.toDomain(await prisma.table.update({ where: { id }, data }));
  } else {
    return this.toDomain(await prisma.table.create({ data }));
  }
}
```

### DTO Validation Pattern
```javascript
validate() {
  if (!this.field) throw new Error('Field is required');
  if (this.field.length < 3) throw new Error('Field too short');
}
```

## Getting Help

When creating a new domain:
1. Reference DDD-LocationController.js for controller pattern
2. Reference LocationApplicationService.js for service pattern
3. Reference PrismaLocationRepository.js for repository pattern
4. Reference LocationDTO.js for DTO pattern
5. Use this roadmap for step-by-step approach

