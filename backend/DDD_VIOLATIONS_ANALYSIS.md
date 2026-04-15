# DDD Violations Analysis & Refactoring Roadmap

## Current Architecture Issues Identified

### 1. **Anemic Domain Model** ⚠️ CRITICAL
**Issue**: Business logic scattered in controllers and services, not in domain objects

```javascript
// BEFORE: Anemic
exports.createLocation = async (location) => {
  return prisma.locations.create({
    data: { ...location, views: location.views ?? 0 }
  });
};

// AFTER: Rich Domain Model
const location = Location.create(id, name, coordinates, props);
location.recordView();
await repository.save(location);
```

**Impact**: Hard to maintain, logic duplication, no business rules enforcement

---

### 2. **No Value Objects** ⚠️ CRITICAL
**Issue**: Primitive types used everywhere without validation

```javascript
// BEFORE: Primitives everywhere
{ latitude: 42, longitude: -93.6, open_time: "10:00", close_time: "22:00" }

// AFTER: Value Objects
{ coordinates: new Coordinates(42, -93.6), hours: new TimeRange("10:00", "22:00") }
```

**Benefits Added**:
- ✅ Automatic validation
- ✅ Type safety
- ✅ Domain methods (distance calculation, overnight detection)
- ✅ Immutability guarantees

**Implemented Value Objects**:
- `Coordinates` - Geographic locations with distance calculation
- `Email` - Email validation and normalization
- `Money` - Currency with arithmetic operations
- `TimeRange` - Operating hours with overnight detection

---

### 3. **No Clear Aggregate Boundaries** ⚠️ CRITICAL
**Issue**: Entities treated independently, no transaction boundaries

```javascript
// BEFORE: All separate
location.addHours()  // separate repository call
location.addDeals()  // separate repository call
user.addFavorite()   // separate repository call

// AFTER: Aggregates with boundaries
const location = locationRepository.findById(id); // Contains all children
location.recordView();
await locationRepository.save(location); // One transaction
```

**Aggregates Defined**:
- **Location Aggregate**: location + location_hours + overrides + methods
- **User Aggregate**: user + favorites + friends + profile + methods

**Benefits**:
- ✅ Consistent state
- ✅ Clear transaction boundaries
- ✅ Easier to reason about
- ✅ Better for event sourcing

---

### 4. **No Domain Events** ⚠️ MAJOR
**Issue**: No way to publish important business events

```javascript
// BEFORE: No events
location.recordView();
// ... nothing happens, no way to track or react

// AFTER: Domain events
location.recordView();
location.publishEvent(new LocationViewedEvent(location));
// Events can be: stored, published, used for notifications, analytics, etc.
```

**Events Implemented**:
- `LocationCreatedEvent`, `LocationUpdatedEvent`, `LocationDeletedEvent`
- `LocationOpenedEvent`, `LocationClosedEvent`
- `UserCreatedEvent`, `UserProfileUpdatedEvent`
- `LocationFavoritedEvent`, `LocationUnfavoritedEvent`

**Benefits**:
- ✅ Audit trail
- ✅ Event-driven architecture
- ✅ Loose coupling
- ✅ Foundation for CQRS/Event Sourcing

---

### 5. **Repositories Without Interfaces** ⚠️ MAJOR
**Issue**: Tightly coupled to Prisma, hard to mock/test

```javascript
// BEFORE: Direct Prisma calls everywhere
await this.prisma.locations.findMany();

// AFTER: Repository interface with implementations
class ILocationRepository {
  async findById(id) { } // Interface defines contract
  async save(location) { } // Methods work with aggregates, not raw models
}

class PrismaLocationRepository extends ILocationRepository {
  // Implementation detail hidden
}
```

**Repository Interfaces Created**:
- `ILocationRepository` - Location persistence contract
- `IUserRepository` - User persistence contract

**Benefits**:
- ✅ Easy to test (mock repositories)
- ✅ Easy to swap implementations (different DB)
- ✅ Works with aggregates, not raw models
- ✅ Clear persistence contracts

---

### 6. **No Data Transfer Objects (DTOs)** ⚠️ MAJOR
**Issue**: Raw database models returned to clients

```javascript
// BEFORE: Database model directly
const user = await prisma.users.findUnique(...);
res.json(user); // Exposes ALL fields

// AFTER: DTOs hide sensitive data
const user = await userService.getUserById(id);
const userDTO = UserResponseDTO.fromDomain(user);
res.json(userDTO); // Only safe fields
```

**DTOs Created**:
- `LocationResponseDTO` - Safe location data for clients
- `CreateLocationDTO` - Validated input for creation
- `UpdateLocationDTO` - Validated input for updates
- `UserResponseDTO` - Safe user data for clients
- `CreateUserDTO` - Validated user input
- `UpdateUserProfileDTO` - Validated profile updates

**Benefits**:
- ✅ Input validation
- ✅ Security (no sensitive fields exposed)
- ✅ Contracts between layers
- ✅ Prevents over-posting attacks

---

### 7. **No Application Services/Use Cases** ⚠️ MAJOR
**Issue**: Controllers directly call repositories, no orchestration layer

```javascript
// BEFORE: Controller has too much logic
exports.createLocation = async (req, res) => {
  // Validation, repository call, error handling all here
  const location = await locationService.createLocation(req.body);
  res.status(201).json(location);
};

// AFTER: Clear separation
async createLocation(req, res) {
  const dto = new CreateLocationDTO(...); // Validation
  const location = await this.locationService.createLocation(dto); // Use case
  res.status(201).json(location);
}
```

**Application Services Created**:
- `LocationApplicationService` - Location use cases
- `UserApplicationService` - User use cases

**Methods Implemented**:
```
LocationApplicationService:
  - getAllLocations()
  - getLocationById()
  - getOpenLocations()
  - findNearby()
  - createLocation()
  - updateLocation()
  - deleteLocation()
  - recordLocationView()

UserApplicationService:
  - createUser()
  - getUserById()
  - getUserByUid()
  - updateUserProfile()
  - searchUsers()
  - addFavoriteLocation()
  - removeFavoriteLocation()
  - deleteUser()
```

**Benefits**:
- ✅ Orchestrates complex operations
- ✅ Reusable from any interface (HTTP, CLI, WebSocket)
- ✅ Transaction management
- ✅ Event publishing
- ✅ Testable business logic

---

### 8. **No Dependency Injection** ⚠️ MAJOR
**Issue**: Hard dependencies, services create their own dependencies

```javascript
// BEFORE: Hard to test and mock
const prisma = new PrismaClient();
const repo = new Repository(prisma);
const service = new Service(repo);

// AFTER: Dependency injection container
class ServiceContainer {
  this.locationService = new LocationApplicationService(
    this.locationRepository,
    this.eventPublisher
  );
}

const container = getServiceContainer();
const service = container.getLocationApplicationService();
```

**Service Container Created**:
- `ServiceContainer` - Wires all dependencies
- Singleton pattern for shared instances
- Easy to mock in tests

**Benefits**:
- ✅ Testable with mocks
- ✅ Flexible configuration
- ✅ Single source of truth for dependencies
- ✅ Easy to swap implementations

---

### 9. **Timezone/Time Handling Mixed with Business Logic** ⚠️ MODERATE
**Issue**: Complex time conversion logic scattered in services

```javascript
// BEFORE: Complex logic in service
const locationTime = DateTime.fromJSDate(dateObj).setZone(loc.timezone);
const currentTimeStr = locationTime.toFormat('HH:mm');

// AFTER: Encapsulated in TimeRange value object
class TimeRange extends BaseValueObject {
  contains(timeStr) { /* complex logic here */ }
  isOvernight() { /* clear intent */ }
}
```

**Implemented**:
- `TimeRange` value object with timezone-aware methods
- Validation of time formats
- Overnight (24-hour spanning) detection
- Clear business intent

---

### 10. **No Rich Behavior on Domains** ⚠️ MODERATE
**Issue**: Business rules not encoded in domain objects

```javascript
// BEFORE: No encapsulation
user.streak = user.streak + 1; // Anywhere in code

// AFTER: Rich behavior
user.incrementStreak(weekNumber, year);
user.resetStreak();
if (user.isAdmin()) { ... }
```

**Rich Behavior Added**:
- **Location**: `recordView()`, `markAsOpen()`, `markAsClosed()`, `isNear()`
- **User**: `incrementStreak()`, `resetStreak()`, `addFavoriteLocation()`, `isFriendsWith()`, `isAdmin()`

---

## Prisma Schema Violations

### Missing Timestamps
```prisma
// BEFORE: Some models missing audit fields
model locations { }

// AFTER: Add to all aggregates
model locations {
  id Int @id
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
}
```

### Weak Foreign Key Relationships
```prisma
// BEFORE: location_id nullable
model events {
  location_id Int?  // Should be required
}

// AFTER: Clear aggregate boundaries
model events {
  location_id Int  // Required - events belong to locations
  locations locations @relation(fields: [location_id], references: [id])
}
```

---

## Refactoring Roadmap

### Phase 1: ✅ Foundation (COMPLETED)
- [x] Create base classes (BaseEntity, BaseValueObject, AggregateRoot)
- [x] Create value objects (Coordinates, Email, Money, TimeRange)
- [x] Define domain events
- [x] Create repository interfaces

### Phase 2: ✅ Aggregates & Services (COMPLETED)
- [x] Implement Location aggregate
- [x] Implement User aggregate
- [x] Create Prisma repository implementations
- [x] Create application services (use cases)
- [x] Create DTOs for requests/responses
- [x] Create dependency injection container
- [x] Create example refactored controllers

### Phase 3: Gradual Migration (NEXT)
**Priority 1 - Core Domains**:
- [ ] Refactor `src/controllers/locationController.js` to use new architecture
- [ ] Refactor `src/controllers/userController.js` to use new architecture
- [ ] Update routes to use refactored controllers
- [ ] Run tests and verify functionality

**Priority 2 - Event Domain**:
- [ ] Create `Event` aggregate
- [ ] Create `EventApplicationService`
- [ ] Create event DTOs
- [ ] Refactor event controller

**Priority 3 - Deal Domain**:
- [ ] Create `Deal` aggregate
- [ ] Create `DealApplicationService`
- [ ] Create deal DTOs
- [ ] Refactor deal controller

**Priority 4 - Social Domain**:
- [ ] Create `Friendship` aggregate
- [ ] Create `Friendship ApplicationService`
- [ ] Create invitation DTOs
- [ ] Refactor friendship controller

### Phase 4: Advanced Features (FUTURE)
- [ ] Implement query objects for complex reads
- [ ] Add event persistence (event store)
- [ ] Implement CQRS patterns
- [ ] Add event saga for workflows
- [ ] Anti-corruption layers for external APIs

---

## Testing Strategy

### Domain Layer (Unit Tests)
```javascript
describe('Location Aggregate', () => {
  it('should create location with valid coordinates', () => {
    const coords = new Coordinates(42, -93);
    const location = Location.create(1, 'Bar', coords);
    expect(location.coordinates).toEqual(coords);
  });

  it('should publish CreatedEvent when created', () => {
    const location = Location.create(1, 'Bar', coords);
    const events = location.getUncommittedEvents();
    expect(events[0]).toBeInstanceOf(LocationCreatedEvent);
  });
});
```

### Application Layer (Integration Tests)
```javascript
describe('LocationApplicationService', () => {
  it('should create location with dto validation', async () => {
    const dto = new CreateLocationDTO('Bar', 42, -93, 'Address');
    const result = await service.createLocation(dto);
    expect(result.id).toBeDefined();
  });

  it('should publish events on creation', async () => {
    await service.createLocation(dto);
    expect(publisherSpy).toHaveBeenCalled();
  });
});
```

### Presentation Layer (API Tests)
```javascript
describe('POST /api/locations', () => {
  it('should create location and return DTO', async () => {
    const res = await request.post('/api/locations').send(validPayload);
    expect(res.status).toBe(201);
    expect(res.body.name).toBe(validPayload.name);
  });
});
```

---

## Benefits Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Testability** | Hard (tightly coupled) | Easy (dependency injection) |
| **Maintainability** | Poor (logic scattered) | Excellent (clear structure) |
| **Reusability** | Limited (HTTP-only) | High (use cases reusable) |
| **Type Safety** | Weak (primitives) | Strong (value objects) |
| **Event Tracking** | None | Full event history |
| **Error Handling** | Inconsistent | Standardized |
| **Scalability** | Limited | Supports growth |
| **Testability** | ~20% coverage | Target 80%+ coverage |

---

## Migration Checklist

- [ ] Phase 1: Foundation infrastructure ✅ DONE
- [ ] Phase 2: Core aggregates and services ✅ DONE  
- [ ] [ ] Refactor location domain
  - [ ] Update location controller
  - [ ] Update location routes
  - [ ] Add location tests
- [ ] [ ] Refactor user domain
  - [ ] Update user controller
  - [ ] Update user routes
  - [ ] Add user tests
- [ ] [ ] Refactor event domain
- [ ] [ ] Refactor deal domain
- [ ] [ ] Refactor friendship domain
- [ ] [ ] Setup event publishing
- [ ] [ ] Add CQRS queries
- [ ] [ ] Add event sourcing
- [ ] [ ] Full test coverage (80%+)
- [ ] [ ] Performance optimization
- [ ] [ ] Documentation complete

---

## References

- Eric Evans: Domain-Driven Design (Blue Book)
- Vaughn Vernon: Implementing Domain-Driven Design
- Sample DDD implementations to review
