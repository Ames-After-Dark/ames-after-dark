# Domain-Driven Design (DDD) Architecture Refactoring

This document outlines the comprehensive DDD refactoring of the Ames After Dark backend API. The architecture has been reorganized into four layers: Domain, Application, Infrastructure, and Presentation.

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│         Presentation Layer (REST Controllers)        │
│  /src/presentation/rest/*.js  /src/presentation/middleware
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────┐
│      Application Layer (Services & DTOs)            │
│  /src/application/use-cases/*.js                    │
│  /src/application/dtos/*.js                         │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────┐
│    Infrastructure Layer (Repositories & DB)         │
│  /src/infrastructure/repositories/*.js              │
│  /src/infrastructure/ServiceContainer.js            │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────┐
│      Domain Layer (Entities & Interfaces)           │
│  /src/domain/entities/*.js                          │
│  /src/domain/repositories/*.js                      │
│  /src/domain/DomainEventPublisher.js                │
└─────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### Domain Layer (`/src/domain/`)
**Purpose**: Contains business logic, entities, and domain rules that are independent of any framework or database.

- **Entities** (`/entities/*.js`): Core domain objects with identity and business logic
  - `User.js`: User aggregate root
  - `Friendship.js`: Friendship relationship
  - `Banner.js`: Promotional banner
  - `Location.js`: Venue/business location
  - `Event.js`: Location-based events
  - `Deal.js`: Location promotions
  - `MenuItem.js`: Menu items for locations
  - `UserLocation.js`: User check-ins
  - `UserFavorite.js`: User favorites
  - `UserSetting.js`: User preferences
  - `LocationHour.js`: Operating hours

**Key Characteristics**:
- No framework dependencies
- No database references
- Self-contained business logic
- Value Objects and Aggregates
- Use `_validate()` and assertion methods for rules

- **Repository Interfaces** (`/repositories/*.js`): Contracts for data persistence
  - Define all persistence contracts
  - No implementation, only signatures

- **DomainEventPublisher** (`DomainEventPublisher.js`): Event publishing interface for domain events

### Application Layer (`/src/application/`)
**Purpose**: Orchestrates domain objects and commands; acts as a use case container.

- **Application Services** (`/use-cases/*ApplicationService.js`): Use case implementations
  - `UserApplicationService.js`: User management use cases
  - `FriendshipApplicationService.js`: Friendship requests and management
  - `BannerApplicationService.js`: Banner management
  - `LocationApplicationService.js`: Location operations
  - `EventApplicationService.js`: Event management
  - `DealApplicationService.js`: Deal management
  - + 5 more services for complete domain coverage

**Key Characteristics**:
- Stateless service classes
- Depends on repositories
- Orchestrates domain logic
- Publishes domain events
- Converts domain objects to DTOs

- **DTOs (Data Transfer Objects)** (`/dtos/*.js`): Request/Response contracts
  - Separate request (`Create*/Update*`) and response DTOs
  - `fromDomain()` static factory methods
  - No business logic

### Infrastructure Layer (`/src/infrastructure/`)
**Purpose**: Implements technical concerns like persistence and external services.

- **Prisma Repositories** (`/repositories/Prisma*Repository.js`): Database implementations
  - Extend domain repository interfaces
  - Implement persistence logic
  - Bridge domain entities and database models
  - Example: `PrismaUserRepository` implements `UserRepository`

- **ServiceContainer** (`ServiceContainer.js`): Dependency injection container
  - Factory for all application services
  - Initializes repositories and services
  - Manages lifecycle and dependencies
  - Provides `getService(serviceName)` method

- **InMemoryEventPublisher**: Simple in-process event bus
  - Subscribes/unsubscribes event handlers
  - Publishes domain events
  - Can be replaced with external message bus

### Presentation Layer (`/src/presentation/`)
**Purpose**: HTTP interfaces and request handlers.

- **REST Controllers** (`/rest/*Routes.js`): HTTP endpoint handlers
  - Factory functions creating Express routers
  - Each domain has a routes file
  - Example: `UserRoutes.js` provides CRUD endpoints for users
  - Handle request/response serialization

- **Middleware** (`/middleware/containerMiddleware.js`): Middleware for dependency injection
  - Injects service container into requests
  - Makes services available to controllers

- **Route Registration** (`/rest/index.js`): Central route registration
  - Registers all route handlers
  - Applies consistent middleware
  - Centralizes API structure

## Data Flow Example

### Creating a User

1. **Presentation**: REST endpoint receives POST `/api/users`
2. **Application Service**: `UserApplicationService.createUser()` called
3. **Domain**: `User.create()` validates business rules
4. **Infrastructure**: `PrismaUserRepository.save()` persists to database
5. **Response**: `UserResponseDTO.fromDomain()` creates response

```
HTTP Request
    ↓
UserRoutes (Presentation)
    ↓
UserApplicationService.createUser()
    ↓
User.create() (Domain validation)
    ↓
PrismaUserRepository.save() (Infrastructure)
    ↓
Domain Events published
    ↓
JSON Response (DTO)
```

## Service Container Usage

### Initialization
```javascript
const { PrismaClient } = require('@prisma/client');
const ServiceContainer = require('./infrastructure/ServiceContainer');

const prisma = new PrismaClient();
const container = new ServiceContainer(prisma);
const dbWithContainer = container.attachToPrisma();
```

### In Controllers
```javascript
function createUserRoutes(container) {
  const userService = container.getService('userApplicationService');
  
  router.post('/users', async (req, res) => {
    const user = await userService.createUser(req.body);
    res.json(user);
  });
}
```

## Available Application Services

| Service | Location | Responsibilities |
|---------|----------|------------------|
| `UserApplicationService` | `use-cases/UserApplicationService.js` | User CRUD operations |
| `FriendshipApplicationService` | `use-cases/FriendshipApplicationService.js` | Friend requests, management |
| `BannerApplicationService` | `use-cases/BannerApplicationService.js` | Banner CRUD |
| `LocationApplicationService` | `use-cases/LocationApplicationService.js` | Location CRUD, geolocation |
| `EventApplicationService` | `use-cases/EventApplicationService.js` | Event management |
| `DealApplicationService` | `use-cases/DealApplicationService.js` | Deal CRUD |
| `MenuItemApplicationService` | `use-cases/MenuItemApplicationService.js` | Menu management |
| `UserLocationApplicationService` | `use-cases/UserLocationApplicationService.js` | Check-ins, visitors |
| `UserFavoriteApplicationService` | `use-cases/UserFavoriteApplicationService.js` | Favorite management |
| `UserSettingApplicationService` | `use-cases/UserSettingApplicationService.js` | Settings management |
| `LocationHourApplicationService` | `use-cases/LocationHourApplicationService.js` | Hours management |

## Key Design Patterns

### 1. Repository Pattern
- Domain layer defines contracts (`UserRepository`)
- Infrastructure implements contracts (`PrismaUserRepository`)
- Decouples business logic from persistence

### 2. Aggregate Pattern
- Entities form aggregate boundaries
- All changes go through aggregate root
- Example: `User` is aggregate root for user-related data

### 3. Value Objects
- Immutable objects without identity
- Encapsulate domain-specific logic
- Example: Email validation could be a value object

### 4. Factory Methods
- `Entity.create()` for domain object creation
- `DTO.fromDomain()` for serialization
- Encapsulates object creation logic

### 5. Event Publishing
- Domain events enable loose coupling
- Example: UserCreated event
- Subscribers can react without domain knowledge
- Facilitates audit logs, notifications, etc.

### 6. Service Container (Inversion of Control)
- Centralizes dependency management
- Makes testing easier with mock repositories
- Reduces coupling between layers

## Testing Strategy

### Unit Tests (Domain Layer)
```javascript
// Test domain rules without database
describe('User', () => {
  it('should not create user with invalid email', () => {
    expect(() => User.create(null, 'invalid', 'John'))
      .toThrow('Invalid email');
  });
});
```

### Integration Tests (Application Layer)
```javascript
// Test with mock repositories
describe('UserApplicationService', () => {
  it('should create user via service', async () => {
    const mockRepo = { save: jest.fn() };
    const service = new UserApplicationService(mockRepo);
    await service.createUser({ email: 'test@example.com' });
    expect(mockRepo.save).toHaveBeenCalled();
  });
});
```

### End-to-End Tests (REST API)
```javascript
// Test complete flow with real database
describe('User API', () => {
  it('POST /api/users should create user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ email: 'test@example.com' });
    expect(response.status).toBe(201);
  });
});
```

## Common Tasks

### Adding a New Entity

1. **Create Domain Entity** (`/domain/entities/MyEntity.js`)
   ```javascript
   class MyEntity {
     constructor(id, prop1, prop2) { ... }
     static create(id, prop1, prop2) { ... }
     validate() { ... }
     getUncommittedEvents() { ... }
   }
   ```

2. **Create Repository Interface** (`/domain/repositories/MyRepository.js`)
   ```javascript
   class MyRepository {
     async findById(id) { throw new Error('not implemented'); }
     async save(entity) { throw new Error('not implemented'); }
   }
   ```

3. **Create Prisma Repository** (`/infrastructure/repositories/PrismaMyRepository.js`)
   ```javascript
   class PrismaMyRepository extends MyRepository {
     async findById(id) { ... }
     async save(entity) { ... }
     _toDomain(data) { ... }
   }
   ```

4. **Create Application Service** (`/application/use-cases/MyApplicationService.js`)
   ```javascript
   class MyApplicationService {
     async function(params) {
       const entity = MyEntity.create(...);
       const saved = await this.repository.save(entity);
       saved.getUncommittedEvents().forEach(e => this.eventPublisher.publish(e));
       return MyResponseDTO.fromDomain(saved);
     }
   }
   ```

5. **Create DTOs** (`/application/dtos/MyDTO.js`)
   ```javascript
   class MyResponseDTO { static fromDomain(entity) { ... } }
   class CreateMyDTO { constructor(prop1, prop2) { ... } }
   ```

6. **Create Routes** (`/presentation/rest/MyRoutes.js`)
   ```javascript
   function createMyRoutes(container) {
     const service = container.getService('myApplicationService');
     router.post('/my-entities', async (req, res) => { ... });
     return router;
   }
   ```

7. **Register in ServiceContainer** (`/infrastructure/ServiceContainer.js`)
   ```javascript
   this.myRepository = new PrismaMyRepository(this.prismaClient);
   this.myApplicationService = new MyApplicationService(
     this.myRepository,
     this.eventPublisher
   );
   ```

8. **Register routes** (`/presentation/rest/index.js`)
   ```javascript
   app.use('/api', createMyRoutes(container));
   ```

## Migration Path

### During Refactoring:
- **Old Controllers** use direct Prisma queries
- **New Controllers** use Application Services
- Routes can coexist during transition
- Gradual migration of endpoints

### After Refactoring:
- Remove old controller files completely
- All traffic through DDD layer
- Consistent error handling and logging
- Full test coverage through all layers

## Benefits of This Architecture

✅ **Testability**: Each layer can be tested independently
✅ **Maintainability**: Clear separation of concerns
✅ **Scalability**: Easy to add new domains
✅ **Flexibility**: Swap implementations without changing business logic
✅ **Reusability**: Application services can be used by multiple interfaces (REST, GraphQL, gRPC)
✅ **Business Clarity**: Domain logic is expressed in business terms
✅ **Event-Driven**: Foundation for event sourcing, sagas
✅ **Team Scalability**: Clear contracts between domains

## Next Steps

1. ✅ Create domain entities with validation
2. ✅ Define repository interfaces
3. ✅ Implement Prisma repositories
4. ✅ Create application services
5. ✅ Create DTOs
6. ✅ Build REST controllers
7. ✅ Set up service container
8. → Integrate with existing index.js
9. → Add error handling middleware
10. → Create comprehensive tests
11. → Document API endpoints
12. → Migrate all old endpoints
13. → Performance optimization
14. → Add caching strategies
15. → Implement audit logging

## Integration with Existing Code

To integrate this new architecture with the existing `index.js`:

```javascript
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const ServiceContainer = require('./infrastructure/ServiceContainer');
const registerRoutes = require('./presentation/rest');
const containerMiddleware = require('./presentation/middleware/containerMiddleware');

const app = express();
const prisma = new PrismaClient();

// Initialize service container
const container = new ServiceContainer(prisma);
container.attachToPrisma();

// Middleware
app.use(express.json());
app.use(containerMiddleware(container));

// Register all routes
registerRoutes(app, container);

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

This creates a clean, scalable, and maintainable backend architecture following DDD principles.
