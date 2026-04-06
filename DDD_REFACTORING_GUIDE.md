# DDD Refactoring Implementation Guide

## Overview

This guide shows how to migrate from the current anemic domain model to a proper DDD-based architecture.

## New Directory Structure

```
backend/src/
  ├── domain/              # ← NEW: Domain layer (business logic)
  │   ├── entities/        # Domain entities (Banner, Deal, Event, Location, User)
  │   ├── valueObjects/    # Value objects (IDs, Email, DateRange)
  │   ├── services/        # Domain services (BannerService, DealService, etc.)
  │   └── errors/          # Custom domain errors
  ├── dtos/                # ← NEW: Data Transfer Objects
  ├── repositories/        # ← NEW: Data persistence interfaces (Prisma adapters)
  ├── controllers/         # Refactored controllers (use domain services)
  ├── routes/              # Refactored routes (DDD-compliant naming)
  ├── middleware/          # Authentication, validation middleware
  └── services/            # Keep old services, refactor to use domain layer
```

## Architecture Layers

### 1. Domain Layer (NEW)
- **Location**: `/domain/entities/`, `/domain/valueObjects/`, `/domain/services/`, `/domain/errors/`
- **Purpose**: Pure business logic independent of framework/database
- **Dependencies**: None (or minimal, other domain objects)
- **Testability**: ✅ 100% unit testable without database/HTTP

**Example: Banner Entity**
```javascript
// domain/entities/index.js
class Banner extends Entity {
  constructor(id, name, imageUrl) {
    super(id);
    this.validate(name, imageUrl);
    this.name = name;
    this.imageUrl = imageUrl;
  }

  validate(name, imageUrl) {
    if (!name || !imageUrl) throw new Error('Required fields missing');
  }

  activate() { this.isActive = true; }
  deactivate() { this.isActive = false; }
}
```

### 2. Domain Services (NEW)
- **Location**: `/domain/services/`
- **Purpose**: Orchestrates domain entities, enforces business rules
- **Depends on**: Repositories (abstraction via interface)
- **Pattern**: CQRS-like with command/query methods

**Example: BannerDomainService**
```javascript
// domain/services/BannerDomainService.js
class BannerDomainService {
  async createBanner(command) {
    const banner = new Banner(null, command.name, command.imageUrl);
    return this.bannerRepository.save(banner);
  }

  async getActiveBanners() {
    const all = await this.bannerRepository.findAll();
    return all.filter(b => b.isActive);
  }
}
```

### 3. DTOs (Data Transfer Objects) (NEW)
- **Location**: `/dtos/`
- **Purpose**: Validation gate between HTTP layer and domain
- **Pattern**: Converts request/response data

**Example**
```javascript
// dtos/index.js
class CreateBannerDTO {
  constructor(name, imageUrl) {
    this.name = name;
    this.imageUrl = imageUrl;
  }

  static fromRequest(req) {
    if (!req.name || !req.image_url) {
      throw new Error('Missing fields');
    }
    return new CreateBannerDTO(req.name, req.image_url);
  }
}
```

### 4. Repositories (NEW)
- **Location**: `/repositories/` (to be created)
- **Purpose**: Abstract data persistence, implement domain interfaces
- **Converts**: Domain entities ↔ Prisma models

**Example Pattern** (to be implemented)
```javascript
class BannerRepository {
  async save(banner) {
    // Banner.toPersistence() converts entity to DB format
    const data = banner.toPersistence();
    return prisma.banners.upsert({...});
  }

  async findById(id) {
    const data = await prisma.banners.findUnique({...});
    return Banner.fromPersistence(data); // Convert back to entity
  }
}
```

### 5. Controllers (REFACTORED)
- **Location**: `/controllers/`
- **Changes**: 
  - Use domain services instead of data access services
  - Use DTOs for validation
  - Clear error handling (domain errors → HTTP responses)
  - Stateless HTTP layer

**Example**
```javascript
// controllers/BannerControllerRefactored.js
class BannerController {
  constructor(bannerDomainService) {
    this.bannerService = bannerDomainService;
  }

  async createBanner(req, res) {
    try {
      const dto = CreateBannerDTO.fromRequest(req.body);
      const banner = await this.bannerService.createBanner(dto);
      return res.status(201).json(new BannerResponseDTO(banner));
    } catch (error) {
      if (error instanceof InvalidBannerError) {
        return res.status(400).json({ error: error.message });
      }
      // ... other error handling
    }
  }
}
```

### 6. Routes (REFACTORED)
- **Location**: `/routes/`
- **Changes**:
  - Clear command semantics: `POST /commands/activate` instead of implicit state change
  - Cleaner resource hierarchy
  - Dependency injection of controller

**Example: Before vs After**

**BEFORE** (anemic domain)
```javascript
router.post('/:id/activate', controller.activate);  // Unclear
router.post('/:id/deactivate', controller.deactivate);  // Unclear
```

**AFTER** (DDD-compliant)
```javascript
router.post('/:id/commands/activate', controller.activateBanner);  // Explicit command
router.post('/:id/commands/deactivate', controller.deactivateBanner);  // Explicit command
```

---

## Migration Path

### Phase 1: Create Domain Layer (✓ COMPLETED)
- [x] Create domain entities
- [x] Create value objects
- [x] Create domain services
- [x] Create custom domain errors

### Phase 2: Extract Business Logic (✓ COMPLETED)
- [x] Create AlbumService (extract from r2Routes)
- [x] Create DTOs

### Phase 3: Refactor Controllers (IN PROGRESS)
- [ ] Create refactored controllers for all entities
- [ ] Update controllers to use domain services

### Phase 4: Refactor Routes (TODO)
- [ ] Update routes to use new controllers
- [ ] Ensure dependency injection pattern

### Phase 5: Create Repositories (TODO)
- [ ] Create repository interfaces
- [ ] Implement Prisma repositories

### Phase 6: Update Application Bootstrap (TODO)
- [ ] Wire up dependency injection
- [ ] Register all services

### Phase 7: Clean Up (TODO)
- [ ] Keep old services as fallback during migration
- [ ] Remove old services once fully migrated
- [ ] Update tests

---

## Specific Changes by Aggregate

### Banner Aggregate
✅ **Complete**
- Domain Entity: `domain/entities/index.js` → `Banner` class
- Domain Service: `domain/services/BannerDomainService.js`
- DTOs: `dtos/index.js` → `CreateBannerDTO`, `BannerResponseDTO`
- Controller: `controllers/BannerControllerRefactored.js`
- Routes: `routes/BannerRoutesRefactored.js`

### Deal Aggregate
⚠️ **In Progress**
- [x] Domain Entity: `domain/entities/index.js` → `Deal` class
- [x] Domain Service: `domain/services/DealDomainService.js`
- [x] DTOs: `dtos/index.js` → `CreateDealDTO`, `DealResponseDTO`
- [ ] Controller: Need `controllers/DealControllerRefactored.js`
- [ ] Routes: Need `routes/DealRoutesRefactored.js`

### Event Aggregate
⚠️ **In Progress**
- [x] Domain Entity: `domain/entities/index.js` → `Event` class
- [x] Domain Service: `domain/services/EventDomainService.js`
- [x] DTOs: `dtos/index.js` → `CreateEventDTO`, `EventResponseDTO`
- [ ] Controller: Need `controllers/EventControllerRefactored.js`
- [ ] Routes: Need `routes/EventRoutesRefactored.js`

### Location Aggregate
⚠️ **In Progress**
- [x] Domain Entity: `domain/entities/location.js` → `Location` class
- [x] Domain Service: `domain/services/LocationDomainService.js`
- [x] DTOs: `dtos/index.js` → `CreateLocationDTO`, `LocationResponseDTO`
- [ ] Controller: Need `controllers/LocationControllerRefactored.js`
- [ ] Routes: Need `routes/LocationRoutesRefactored.js`
- [ ] Handle child aggregates (Hours, MenuItems)

### User Aggregate
⚠️ **In Progress**
- [x] Domain Entity: `domain/entities/location.js` → `User` class
- [x] Domain Service: `domain/services/UserDomainService.js`
- [x] DTOs: `dtos/index.js` → Multiple user DTOs
- [ ] Controller: Need `controllers/UserControllerRefactored.js`
- [ ] Routes: Need `routes/UserRoutesRefactored.js`
- [ ] Handle UserSettings, UserFavorites, Friendships as bounded contexts

---

## Key Principles Applied

### 1. ✅ Domain-Driven Design
- **Before**: Controllers directly call Prisma via services
- **After**: Controllers call domain services, which orchestrate entities

### 2. ✅ Separation of Concerns
- **Before**: Business logic scattered across services and controllers
- **After**: Domain logic in entities, orchestration in services, HTTP handling in controllers

### 3. ✅ Value Objects for Type Safety
- **Before**: `const id = parseInt(req.params.id, 10);` in controllers
- **After**: `const id = EntityIds.bannerId(id);` throws error if invalid

### 4. ✅ Explicit Commands vs Queries
- **Before**: `router.post('/toggle-favorite')`  (unclear semantics)
- **After**: `router.post('/commands/add-favorite')` (explicit intent)

### 5. ✅ Business Rule Enforcement at Domain Level
- **Before**: Friends validation in controller
- **After**: `user.sendFriendRequest(targetId)` enforces all rules (no self-requests, no duplicates, etc.)

### 6. ✅ Testability
- **Before**: Need database to test `bannerService.getActiveBanners()`
- **After**: Can test `Banner.hasActiveOccurrence()` without any dependencies

---

## Example: Complete Banner Flow

### Request: Create a Banner

**1. Route Handler** (HTTP layer)
```javascript
router.post('/', (req, res) => bannerController.createBanner(req, res));
```

**2. Controller** (translates HTTP → Domain)
```javascript
async createBanner(req, res) {
  const dto = CreateBannerDTO.fromRequest(req.body); // Validation
  const banner = await this.bannerService.createBanner(dto); // Domain logic
  return res.status(201).json(new BannerResponseDTO(banner)); // Response DTO
}
```

**3. Domain Service** (orchestrates domain logic)
```javascript
async createBanner(command) {
  const banner = new Banner(null, command.name, command.imageUrl); // Entity validates
  return this.bannerRepository.save(banner); // Persist
}
```

**4. Domain Entity** (enforces invariants)
```javascript
constructor(id, name, imageUrl) {
  super(id);
  this.validate(name, imageUrl); // Throws InvalidBannerError if invalid
  this.name = name;
  this.imageUrl = imageUrl;
}
```

**5. Repository** (data persistence)
```javascript
async save(banner) {
  const data = banner.toPersistence(); // Convert entity to DB format
  return prisma.banners.create({ data });
}
```

---

## Testing Benefits

### Before (Anemic Model)
```javascript
// ❌ Requires database
it('should return active banners', async () => {
  const db = await setupTestDB();
  const result = await bannerService.getActiveBanners();
  expect(result).toHaveLength(3);
  await teardownTestDB();
});
```

### After (Domain Model)
```javascript
// ✅ Unit test, no database
it('should validate banner name', () => {
  expect(() => new Banner(1, '', 'url')).toThrow(Error);
});

it('should mark banner as active', () => {
  const banner = new Banner(1, 'name', 'url');
  banner.activate();
  expect(banner.isActive).toBe(true);
});
```

---

## Next Steps

1. **Implement remaining controllers** (Deal, Event, Location, User)
2. **Create repository layer** to abstract Prisma
3. **Update application bootstrap** to wire dependency injection
4. **Migrate tests** to use new architecture
5. **Gradually switch routes** to use new controllers
6. **Delete old service files** once fully migrated

---

## Files Created

✅ **Domain Layer**
- `/domain/errors/index.js` - Custom domain errors
- `/domain/valueObjects/index.js` - Value objects (IDs, Email, etc.)
- `/domain/entities/index.js` - Banner, Deal, Event entities
- `/domain/entities/location.js` - Location, User entities
- `/domain/services/BannerDomainService.js`
- `/domain/services/DealDomainService.js`
- `/domain/services/EventDomainService.js`
- `/domain/services/LocationDomainService.js`
- `/domain/services/UserDomainService.js`
- `/domain/services/AlbumService.js` - Extracted from r2Routes

✅ **DTO Layer**
- `/dtos/index.js` - All DTOs

✅ **Refactored Components**
- `/controllers/BannerControllerRefactored.js`
- `/routes/BannerRoutesRefactored.js`

---

## Summary of Violations Fixed

| Violation | Before | After |
|-----------|--------|-------|
| Infrastructure in routes | `r2Routes.js` with S3 logic | `AlbumService.js` with clean domain layer |
| No domain entities | Generic services | Domain entities with behavior |
| Fragmented aggregates | Location in 3 files | Single Location aggregate |
| Unclear commands | `POST /toggle` | `POST /commands/add-favorite` |
| Leaky abstractions | Prisma errors in controllers | Domain errors at boundary |
| Anemic models | Data access only | Rich domain objects |
| No ubiquitous language | Generic CRUD | Intent-based operations |

