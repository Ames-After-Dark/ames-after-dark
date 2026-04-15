# Domain-Driven Design (DDD) Implementation Guide

## Overview

This document describes the comprehensive Domain-Driven Design implementation for the Ames After Dark backend. DDD helps create maintainable, scalable systems by organizing code around business domains and enforcing clear architectural boundaries.

## Architecture Layers

The codebase is organized into 4 main layers:

### 1. **Presentation Layer** (`src/controllers/`)
- HTTP request/response handling
- Input validation
- Error handling and status codes
- Calls application services (use cases)

Example: `DDD-LocationController.js`, `DDD-UserController.js`

### 2. **Application Layer** (`src/application/`)

#### Use Cases / Application Services
- Orchestrates domain logic
- Coordinates multiple aggregates
- Handles transactions
- Publishes domain events
- Located in: `src/application/use-cases/`

#### Data Transfer Objects (DTOs)
- Contracts for data transfer between layers
- No business logic
- Immutable representations
- Located in: `src/application/dtos/`

Example usage:
```javascript
const createDTO = new CreateLocationDTO(name, lat, lng, address);
createDTO.validate();
const result = await locationService.createLocation(createDTO);
```

### 3. **Domain Layer** (`src/domain/`)

#### Value Objects (`src/domain/value-objects/`)
- Immutable objects without identity
- Represent domain concepts (Coordinates, Email, Money, TimeRange)
- Encapsulate validation logic
- Equal when their properties are equal

```javascript
const coordinates = new Coordinates(latitude, longitude);
const distance = coordinates.distanceTo(otherCoordinates);
```

#### Entities (`src/domain/entities/`)
- Mutable objects with identity
- Represent business concepts
- Have lifecycle (created, updated, deleted)

#### Aggregates (`src/domain/aggregates/`)
- Root entities that manage related entities/value objects
- Transaction boundaries
- Main `Aggregate Roots`: Location, User

```javascript
const location = Location.create(id, name, coordinates, props);
location.recordView();
const events = location.getUncommittedEvents();
```

#### Domain Events (`src/domain/events/`)
- Published when important domain changes occur
- Represent what happened
- Enable loose coupling between aggregates

```javascript
class LocationCreatedEvent extends DomainEvent {
  constructor(location, name, coordinates, address) {
    super(location, 'LocationCreated', { name, coordinates, address });
  }
}
```

#### Repository Interfaces (`src/domain/repositories/`)
- Define contracts for persistence
- Abstract away implementation details
- Enable dependency injection

```javascript
class ILocationRepository {
  async findById(id) { }
  async save(location) { }
}
```

### 4. **Infrastructure Layer** (`src/infrastructure/`)

#### Repository Implementations
- Implement repository interfaces using Prisma
- Handle data mapping between domain and database
- Located in: `src/infrastructure/repositories/`

```javascript
class PrismaLocationRepository extends ILocationRepository {
  toDomain(raw) { /* Convert DB model to domain aggregate */ }
  toPersistence(location) { /* Convert aggregate to DB format */ }
}
```

#### Event Bus / Publisher
- Publishes domain events
- Connects event handlers
- Located in: `src/infrastructure/event-bus/`

#### Service Container
- Dependency injection container
- Wires all dependencies
- Single composition root
- Located in: `src/infrastructure/ServiceContainer.js`

### 5. **Shared Layer** (`src/shared/`)

#### Base Classes
- `BaseEntity` - Base for all entities
- `BaseValueObject` - Base for all value objects
- `AggregateRoot` - Base for aggregate roots
- `DomainEvent` - Base for domain events

## DDD Principles Applied

### 1. **Bounded Contexts**
Each major domain is isolated:
- **Location Context**: Manages locations, hours, deals, events
- **User Context**: Manages users, profiles, relationships

### 2. **Ubiquitous Language**
Domain concepts are represented as classes:
- Location (not "bar" or "venue")
- Coordinates (not "lat/long numbers")
- Email (not "string")
- TimeRange (not "open_time, close_time strings")

### 3. **Aggregates**
Transaction boundaries are clear:
- Location aggregate: controls location_hours, deals, events
- User aggregate: controls favorites, friendships, settings

### 4. **Value Objects**
Provide type safety and encapsulation:
```javascript
// Instead of: { latitude: 42.0, longitude: -93.6 }
const coords = new Coordinates(42.0, -93.6); // Validated, typed
```

### 5. **Domain Events**
Publish important business events:
```javascript
location.publishEvent(new LocationCreatedEvent(location, name, coords, address));
```

### 6. **Repositories**
Abstract persistence:
```javascript
const location = await locationRepository.findById(id); // Returns domain aggregate
location.recordView();
await locationRepository.save(location); // Persists changes
```

## Migration Path

### Phase 1: Create Base Infrastructure ✅ COMPLETED
- [x] Base classes (BaseEntity, BaseValueObject, AggregateRoot)
- [x] Value objects (Coordinates, Email, Money, TimeRange)
- [x] Domain events
- [x] Repository interfaces

### Phase 2: Implement Aggregates ✅ COMPLETED
- [x] Location aggregate
- [x] User aggregate
- [x] Repository implementations
- [x] Application services

### Phase 3: Refactor Controllers (IN PROGRESS)
- [ ] Refactor existing controllers to use application services
- [ ] Replace direct service calls with DI container
- [ ] Update route handlers

### Phase 4: Create More Aggregates (REMAINING)
- [ ] Event aggregate
- [ ] Deal aggregate
- [ ] Friendship aggregate
- [ ] UserSettings aggregate

### Phase 5: Event Publishing (REMAINING)
- [ ] Connect event publishers to domain events
- [ ] Create event handlers for side effects
- [ ] Log events to audit trail

### Phase 6: Advanced Patterns (REMAINING)
- [ ] Add query objects for complex queries
- [ ] Implement anti-corruption layer for external APIs
- [ ] Add domain services for cross-aggregate operations

## Example: Creating a Location

### Old Approach (Anemic)
```javascript
// Controller
const location = await locationService.createLocation(req.body);

// Service
exports.createLocation = async (data) => {
  return prisma.locations.create({ data });
};
```

### DDD Approach
```javascript
// Controller
const createDTO = new CreateLocationDTO(name, lat, lng, address);
const location = await this.locationService.createLocation(createDTO);

// Application Service
async createLocation(createLocationDTO) {
  createLocationDTO.validate();
  const coordinates = new Coordinates(createLocationDTO.latitude, createLocationDTO.longitude);
  const location = Location.create(id, createLocationDTO.name, coordinates, props);
  
  const saved = await this.locationRepository.save(location);
  
  // Publish events
  for (const event of location.getUncommittedEvents()) {
    await this.eventPublisher.publish(event);
  }
  
  return LocationResponseDTO.fromDomain(saved);
}

// Domain Aggregate
class Location extends AggregateRoot {
  static create(id, name, coordinates, props) {
    if (!name) throw new Error('Name required');
    if (!(coordinates instanceof Coordinates)) throw new Error('Invalid coordinates');
    
    const location = new Location(id, name, coordinates, props);
    location.publishEvent(new LocationCreatedEvent(location, name, coordinates, props.address));
    return location;
  }
}
```

## Benefits Realized

1. **Testability**: Domain logic decoupled from HTTP/database
2. **Maintainability**: Clear separation of concerns
3. **Scalability**: Easy to add new features
4. **Reusability**: Domain logic usable from CLI, events, etc.
5. **Type Safety**: Value objects provide runtime validation
6. **Event Sourcing Ready**: Domain events enable future event sourcing
7. **Bounded Contexts**: Easy to extract microservices

## Testing Strategy

```javascript
// Domain layer - pure unit tests
describe('Location Aggregate', () => {
  it('should create location with valid coordinates', () => {
    const location = Location.create(1, 'Ames Bar', new Coordinates(42, -93));
    expect(location.name).toBe('Ames Bar');
  });
});

// Application layer - use case tests
describe('LocationApplicationService', () => {
  it('should create location and publish events', async () => {
    const dto = new CreateLocationDTO('Bar', 42, -93, '123 Main');
    const result = await service.createLocation(dto);
    expect(result.name).toBe('Bar');
  });
});

// Integration tests - end-to-end
describe('POST /api/locations', () => {
  it('should create location via API', async () => {
    const response = await request.post('/api/locations')
      .send({ name: 'Bar', latitude: 42, longitude: -93 });
    expect(response.status).toBe(201);
  });
});
```

## Key Files Reference

### Shared Foundation
- `src/shared/BaseEntity.js` - Entity base class
- `src/shared/BaseValueObject.js` - Value object base class
- `src/shared/AggregateRoot.js` - Aggregate root base class
- `src/shared/DomainEvent.js` - Domain event base class

### Domain Layer
- `src/domain/value-objects/Coordinates.js` - Geographic coordinates
- `src/domain/value-objects/Email.js` - Email validation
- `src/domain/value-objects/Money.js` - Monetary amounts
- `src/domain/value-objects/TimeRange.js` - Operating hours
- `src/domain/aggregates/Location.js` - Location aggregate root
- `src/domain/aggregates/User.js` - User aggregate root
- `src/domain/repositories/ILocationRepository.js` - Repository interface
- `src/domain/events/LocationEvents.js` - Location domain events

### Application Layer
- `src/application/use-cases/LocationApplicationService.js` - Location use cases
- `src/application/use-cases/UserApplicationService.js` - User use cases
- `src/application/dtos/LocationDTO.js` - Location DTOs
- `src/application/dtos/UserDTO.js` - User DTOs

### Infrastructure Layer
- `src/infrastructure/repositories/PrismaLocationRepository.js` - Location persistence
- `src/infrastructure/repositories/PrismaUserRepository.js` - User persistence
- `src/infrastructure/event-bus/EventPublisher.js` - Event publishing
- `src/infrastructure/ServiceContainer.js` - Dependency injection

### Controllers
- `src/controllers/DDD-LocationController.js` - DDD-refactored location controller
- `src/controllers/DDD-UserController.js` - DDD-refactored user controller

## Next Steps

1. **Refactor remaining controllers** to use new architecture
2. **Create Event Handlers** to respond to domain events
3. **Add more aggregates** (Event, Deal, Friendship, etc.)
4. **Implement queries** for read operations
5. **Add more value objects** as needed
6. **Set up event bus** for real event publishing
7. **Create integration tests** for use cases

## Resources

- [Eric Evans - Domain-Driven Design](https://www.domainlanguage.com/ddd/)
- [Vaughn Vernon - Implementing DDD](https://vaughnvernon.com/)
- [Martin Fowler - Domain-Driven Design](https://martinfowler.com/tags/domain%20driven%20design.html)
