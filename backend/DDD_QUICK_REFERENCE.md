# DDD Architecture - Quick Reference Guide

## Project Structure

```
src/
├── controllers/              # Presentation Layer - HTTP Request Handling
│   ├── DDD-LocationController.js   ✅ Example: Refactored location controller
│   ├── DDD-UserController.js       ✅ Example: Refactored user controller
│   ├── locationController.js       ⏳ TODO: Refactor to use new architecture
│   ├── eventController.js          ⏳ TODO: Refactor to use new architecture
│   ├── dealController.js           ⏳ TODO: Refactor to use new architecture
│   └── ...
│
├── routes/                   # Route Definitions
│   ├── locationRoutes.js    # Location endpoints
│   ├── eventRoutes.js       # Event endpoints (update to use DDD-EventController)
│   ├── dealRoutes.js        # Deal endpoints (update to use DDD-DealController)
│   └── ...
│
├── middleware/              # Middleware
│   └── authMiddleware.js
│
├── application/             # Application Layer - Business Rules & Coordination
│   ├── services/
│   │   ├── LocationApplicationService.js    ✅ Location use cases
│   │   ├── UserApplicationService.js        ✅ User use cases
│   │   ├── EventApplicationService.js       ⏳ TODO
│   │   ├── DealApplicationService.js        ⏳ TODO
│   │   └── ...
│   │
│   └── dtos/
│       ├── LocationDTO.js                   ✅ Location transfer objects
│       ├── UserDTO.js                       ✅ User transfer objects
│       ├── EventDTO.js                      ⏳ TODO
│       ├── DealDTO.js                       ⏳ TODO
│       └── ...
│
├── domain/                  # Domain Layer - Business Logic
│   ├── entities/
│   │   ├── Location.js                      ✅ Location aggregate root
│   │   ├── User.js                          ✅ User aggregate root
│   │   ├── Event.js                         ⏳ TODO
│   │   ├── Deal.js                          ⏳ TODO
│   │   └── ...
│   │
│   ├── value-objects/
│   │   ├── Coordinates.js                   ✅ Geographic location (lat, long)
│   │   ├── TimeRange.js                     ✅ Operating hours (open-close time)
│   │   ├── Email.js                         ✅ Email validation
│   │   └── Money.js                         ✅ Currency (amount, currency code)
│   │
│   ├── events/
│   │   ├── LocationEvents.js                ✅ Location domain events
│   │   ├── UserEvents.js                    ✅ User domain events
│   │   ├── EventEvents.js                   ⏳ TODO
│   │   ├── DealEvents.js                    ⏳ TODO
│   │   └── ...
│   │
│   └── repositories/
│       ├── ILocationRepository.js           ✅ Location persistence contract
│       ├── IUserRepository.js               ✅ User persistence contract
│       ├── IEventRepository.js              ⏳ TODO
│       ├── IDealRepository.js               ⏳ TODO
│       └── ...
│
├── infrastructure/          # Infrastructure Layer - Technical Details
│   ├── repositories/
│   │   ├── PrismaLocationRepository.js      ✅ Location Prisma implementation
│   │   ├── PrismaUserRepository.js          ✅ User Prisma implementation
│   │   ├── PrismaEventRepository.js         ⏳ TODO
│   │   ├── PrismaDealRepository.js          ⏳ TODO
│   │   └── ...
│   │
│   ├── EventPublisher.js                    ✅ Event bus (in-memory)
│   └── ServiceContainer.js                  ✅ Dependency injection container
│
├── shared/                  # Shared Foundations
│   ├── BaseEntity.js                        ✅ Base class for entities
│   ├── BaseValueObject.js                   ✅ Base class for value objects
│   ├── AggregateRoot.js                     ✅ Base class for aggregates
│   └── DomainEvent.js                       ✅ Base class for domain events
│
├── db.js                    # Deprecated - Not used
├── index.js                 # Express server setup
└── swaggerConfig.js         # Swagger API documentation
```

## Data Flow Examples

### Creating a Location

```
1. HTTP Request
   POST /api/locations
   Body: { name: "Bar Name", latitude: 42, longitude: -93 }
   ↓
2. DDD-LocationController
   - Parse request
   - Create LocationDTO from body
   - Call locationService.createLocation(dto)
   ↓
3. LocationApplicationService
   - Validate DTO
   - Create Location aggregate
   - Call repository.save(location)
   - Publish domain events
   - Return LocationResponseDTO
   ↓
4. PrismaLocationRepository
   - Map aggregate to Prisma format
   - Save to database
   - Return Location aggregate
   ↓
5. EventPublisher
   - Publish LocationCreatedEvent
   - Subscribers can respond (analytics, emails, etc.)
   ↓
6. HTTP Response
   201 Created
   Body: { id: 1, name: "Bar Name", latitude: 42, longitude: -93 }
```

### Fetching a Location

```
1. HTTP Request
   GET /api/locations/1
   ↓
2. DDD-LocationController
   - Extract ID from URL
   - Call locationService.getLocationById(1)
   ↓
3. LocationApplicationService
   - Call repository.findById(1)
   - Convert to LocationResponseDTO
   ↓
4. PrismaLocationRepository
   - Query database
   - Map raw data to Location aggregate
   ↓
5. HTTP Response
   200 OK
   Body: { id: 1, name: "Bar Name", latitude: 42, longitude: -93 }
```

## Layer Responsibilities

### Presentation Layer (`controllers/`)
- **Input**: HTTP requests
- **Output**: HTTP responses or JSON
- **Responsibility**: 
  - Parse HTTP requests
  - Validate through DTOs
  - Call application services
  - Format responses
- **Does NOT**:
  - Touch database directly
  - Execute business logic
  - Know about Prisma

**Example**:
```javascript
async getLocationById(req, res) {
  const { id } = req.params;
  const location = await this.locationService.getLocationById(id);
  res.json(location);
}
```

### Application Layer (`application/`)
- **Input**: DTOs from controllers
- **Output**: DTOs for controllers
- **Responsibility**:
  - Orchestrate use cases
  - Coordinate repositories
  - Publish domain events
  - Handle transactions
- **Does NOT**:
  - Touch HTTP layer
  - Execute domain logic (that's in aggregates)
  - Know about view models

**Example**:
```javascript
async createLocation(dto) {
  dto.validate();
  const location = Location.create(...);
  const saved = await this.repository.save(location);
  this.eventPublisher.publish(saved.getUncommittedEvents());
  return LocationResponseDTO.fromDomain(saved);
}
```

### Domain Layer (`domain/`)
- **Input**: Method calls from application services
- **Output**: Domain objects, events
- **Responsibility**:
  - Implement business rules
  - Validate state transitions
  - Publish domain events
  - Protect invariants
- **Does NOT**:
  - Know about HTTP, databases, or frameworks
  - Execute use cases
  - Know about DTOs

**Example**:
```javascript
class Location extends AggregateRoot {
  recordView() {
    this.views += 1;
    this.publishEvent(new LocationViewedEvent(this.id));
  }

  isNear(otherCoordinates) {
    return this.coordinates.distanceTo(otherCoordinates) < 1; // 1km
  }
}
```

### Infrastructure Layer (`infrastructure/`)
- **Input**: Domain objects from domain layer
- **Output**: Persistence results
- **Responsibility**:
  - Implement repository interfaces
  - Map between domain and database models
  - Handle database operations
  - Implement event publishing
- **Does NOT**:
  - Execute business logic
  - Know about HTTP layer
  - Validate domain rules

**Example**:
```javascript
class PrismaLocationRepository extends ILocationRepository {
  async save(location) {
    const data = this.toPersistence(location);
    const saved = await prisma.locations.create({ data });
    return this.toDomain(saved);
  }

  toDomain(raw) {
    return new Location(raw.id, raw.name, ...);
  }
}
```

### Shared Layer (`shared/`)
- **Input**: Subclassed by domain layer
- **Output**: Base functionality
- **Responsibility**:
  - Provide base classes
  - Define common patterns
  - Implement cross-cutting concerns
- **Does NOT**:
  - Know about specific domains
  - Extend other shared classes

**Example**:
```javascript
class BaseEntity {
  constructor(id) {
    this.id = id;
  }

  equals(other) {
    return this.id === other.id;
  }
}

class Location extends AggregateRoot extends BaseEntity {
  // Has id-based equality
}
```

## Key Patterns

### Value Object Pattern
```javascript
// ✅ DO THIS
const coordinates = new Coordinates(42, -93);
location.coordinates = coordinates; // Type-safe

// ❌ DON'T DO THIS
location.latitude = 42;
location.longitude = -93;
```

### Repository Pattern
```javascript
// ✅ DO THIS
const location = await repo.findById(1); // Returns aggregate
await repo.save(location);              // Saves entire aggregate

// ❌ DON'T DO THIS
const raw = await prisma.locations.findUnique(...); // Direct DB call
await prisma.locations.update(...);                   // Scattered updates
```

### DTO Pattern
```javascript
// ✅ DO THIS
const dto = new CreateLocationDTO(body.name, body.latitude, ...);
dto.validate();
const location = await service.createLocation(dto);

// ❌ DON'T DO THIS
const location = await service.createLocation(req.body); // No validation
```

### Domain Events Pattern
```javascript
// ✅ DO THIS
location.recordView();
location.publishEvent(new LocationViewedEvent(location.id));
eventPublisher.publish(location.getUncommittedEvents());

// ❌ DON'T DO THIS
location.views += 1;
// No one knows about the view increase
```

### Aggregate Pattern
```javascript
// ✅ DO THIS - All changes through aggregate
const location = await repo.findById(1);
location.recordView();
location.addDeal(deal);
await repo.save(location); // One transaction

// ❌ DON'T DO THIS - Scattered updates
await prisma.locations.update({ data: { views: views + 1 } });
await prisma.deals.update({ data: { location_id: 1 } });
```

## Common Mistakes to Avoid

### ❌ Mistake 1: Business Logic in Controllers
```javascript
// BAD
router.post('/locations/:id/view', async (req, res) => {
  await prisma.locations.update({
    where: { id: parseInt(req.params.id) },
    data: { views: { increment: 1 } }
  });
});

// GOOD
router.post('/locations/:id/view', async (req, res) => {
  const service = container.getLocationService();
  const result = await service.recordLocationView(req.params.id);
  res.json(result);
});
```

### ❌ Mistake 2: Missing DTOs
```javascript
// BAD
async createLocation(req, res) {
  const location = await repo.save(req.body); // No validation
}

// GOOD
async createLocation(req, res) {
  const dto = new CreateLocationDTO(...);
  dto.validate();
  const location = await service.createLocation(dto);
}
```

### ❌ Mistake 3: Domain Logic in Repositories
```javascript
// BAD
async recordView(id) {
  return await prisma.locations.update({
    where: { id },
    data: { views: { increment: 1 } }
  });
}

// GOOD
// In aggregate
recordView() {
  this.views += 1;
  this.publishEvent(new LocationViewedEvent(this.id));
}

// In repository
async save(location) {
  const data = this.toPersistence(location);
  return await prisma.locations.update({ where: { id: location.id }, data });
}
```

### ❌ Mistake 4: No Event Publishing
```javascript
// BAD
locationRepository.save(location);
// How does anyone know this changed?

// GOOD
const saved = await locationRepository.save(location);
saved.getUncommittedEvents().forEach(event => {
  eventPublisher.publish(event);
});
```

### ❌ Mistake 5: Repositories Returning Raw Data
```javascript
// BAD
async findById(id) {
  return await prisma.locations.findUnique({ where: { id } });
  // Returns raw database object
}

// GOOD
async findById(id) {
  const raw = await prisma.locations.findUnique({ where: { id } });
  return this.toDomain(raw); // Returns aggregate
}
```

## File Naming Conventions

| Layer | Type | Pattern | Example |
|-------|------|---------|---------|
| Presentation | Controller | `DDD-[Domain]Controller.js` | `DDD-EventController.js` |
| Application | Service | `[Domain]ApplicationService.js` | `EventApplicationService.js` |
| Application | DTO | `[Domain]DTO.js` | `EventDTO.js` |
| Domain | Aggregate | `[Domain].js` | `Event.js` |
| Domain | Value Object | `[Name].js` | `Coordinates.js` |
| Domain | Events | `[Domain]Events.js` | `EventEvents.js` |
| Domain | Repository Interface | `I[Domain]Repository.js` | `IEventRepository.js` |
| Infrastructure | Repository Impl | `Prisma[Domain]Repository.js` | `PrismaEventRepository.js` |

## Dependencies Flow

```
Controllers
    ↓
ApplicationServices ← EventPublisher
    ↓
Repositories ← Domain Objects/Events
    ↓
Prisma
    ↓
Database
```

**Key Rule**: Dependencies flow DOWN, never UP. Controllers should NOT import repositories directly.

## Testing by Layer

### Domain Tests (Unit Tests)
```javascript
test('Location aggregate', () => {
  const location = Location.create(1, 'Bar', coords);
  location.recordView();
  expect(location.views).toBe(1);
  expect(location.getUncommittedEvents()[0]).toBeInstanceOf(LocationViewedEvent);
});
```

### Application Tests (Integration Tests)
```javascript
test('LocationApplicationService', async () => {
  const dto = new CreateLocationDTO('Bar', 42, -93);
  const result = await service.createLocation(dto);
  expect(result.id).toBeDefined();
});
```

### Presentation Tests (API Tests)
```javascript
test('POST /locations', async () => {
  const res = await request.post('/api/locations').send(payload);
  expect(res.status).toBe(201);
});
```

## Getting Started on New Domain

1. **Copy the pattern** from Location or User aggregate
2. **Create the aggregate** with business logic
3. **Define domain events** that can happen
4. **Create repository interface** with needed queries
5. **Implement Prisma repository** with mappings
6. **Create DTOs** for input validation and output
7. **Create application service** orchestrating use cases
8. **Refactor controller** to use service
9. **Update service container** to wire dependencies
10. **Test all endpoints**

## Questions & Answers

**Q: Should I validate in the DTO or aggregate?**
A: DTOs validate input format (email format, required fields). Aggregates validate business rules (age >= 21, end_time > start_time).

**Q: Where do I call the event publisher?**
A: In application services after saving aggregates: `this.eventPublisher.publish(saved.getUncommittedEvents());`

**Q: Can repositories call other repositories?**
A: No. They implement a single interface. If you need to load related data, do it in the application service.

**Q: What if I need to call multiple aggregates?**
A: Use a Domain Service or Application Service to orchestrate. Never update multiple aggregates in a single transaction unless they're in the same aggregate.

**Q: How do I test this?**
A: Test domain logic with unit tests. Test use cases with integration tests (mock repositories). Test API with end-to-end tests.

**Q: Can I skip DTOs?**
A: Not recommended. DTOs provide: input validation, output filtering, security, and contracts between layers.

