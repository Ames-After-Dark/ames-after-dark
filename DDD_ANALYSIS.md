# DDD (Domain-Driven Design) Violation Analysis: Routes Folder

## Executive Summary
The routes folder exhibits **7 critical DDD violations** representing a traditional anemic domain model architecture. The codebase lacks:
- Clear domain entities with behavior
- Aggregation boundaries  
- Ubiquitous language
- Separation of domain logic from infrastructure
- Consistent command/query patterns

---

## 1. ⚠️ Infrastructure Logic Embedded in Routes

**Location:** [r2Routes.js](backend/src/routes/r2Routes.js)

**Violation:** Business logic is written directly in route handlers instead of being isolated in the domain layer.

**Evidence:**
- S3 client initialization
- Utility functions for date parsing, folder parsing, URL formatting
- Complex filtering and mapping logic
- No service layer abstraction

**Code Example:**
```javascript
// ❌ Infrastructure + Business Logic Mixed in Routes
router.get('/albums', async (req, res) => {
  const allObjects = await listR2Objects('', 5000);
  for (const obj of allObjects) {
    const folderName = key.split('/')[0];
    // ... date parsing, filtering, sorting ...
  }
  res.json(albums);
});
```

**Impact:** 
- Cannot reuse album logic outside HTTP context
- Difficult to test business logic
- Route is responsible for too many concerns

**Recommendation:** Extract to `AlbumService` with domain methods like `getRecentAlbums()`, `getAlbumPhotos()`

---

## 2. ⚠️ No Domain Layer - Anemic Models

**Scope:** Entire routes structure (all files)

**Violation:** The architecture follows Controller → Service → Persistence pattern without a true domain layer. Services are data access facades, not domain objects.

**Architecture Issues:**
```
Routes (HTTP routing)
  ↓
Controllers (Parameter validation, error catching)
  ↓
Services (Prisma queries + basic orchestration)
  ↓
Prisma (Database)

❌ Missing: Domain Entities, Value Objects, Domain Services, Aggregates
```

**Evidence:**
- `bannerService.getActiveBanners()` - just queries database
- `dealService.createDeal(req.body)` - accepts raw request data
- No `Banner`, `Deal`, `Event` domain entities with behavior
- No invariant enforcement at domain level

**What's Missing:**
```javascript
// Missing Domain Entity
class Banner {
  #id;
  #name;
  #imageUrl;
  #createdAt;
  #isActive;

  constructor(id, name, imageUrl, createdAt) {
    if (!name || !imageUrl) throw new Error('Banner requires name and imageUrl');
    this.#id = id;
    this.#name = name;
    this.#imageUrl = imageUrl;
    this.#createdAt = createdAt;
    this.#isActive = this.calculateActive();
  }

  activate() { this.#isActive = true; }
  deactivate() { this.#isActive = false; }
  calculateActive() { /* domain logic */ }
}
```

**Impact:**
- Same validation in multiple controllers
- No centralized business rule enforcement
- Cannot compose domain operations

---

## 3. ⚠️ Unclear Aggregate Boundaries

**Primary Violations:**

### a) **Location Aggregate Fragmented**
```javascript
// ❌ Location split across multiple routes

// locationRoutes.js
/locations               // CRUD
/locations/:id
/locations/open
/locations/with-hours
/locations/admin/:id
/locations/views/:id

// locationHourRoutes.js  
/locationhours/:locationId/weekly    // Location Hours (should be part of Location aggregate)
/locationhours/:locationId/overrides
/locationhours/overrides/:overrideId

// menuItemRoutes.js
/menuitems/location/:locationId      // Menu Items (should be part of Location aggregate)
```

**Issue:** Location Hours and Menu Items should be child aggregates of Location, not separate root aggregates.

### b) **User Aggregate Fragmented**
```javascript
// ❌ User split across multiple routes

// userRoutes.js
/users
/users/:id
/users/auth/*

// userSettingRoutes.js
/usersettings/:userId               // Should be part of User aggregate

// userFavoriteRoutes.js
/userfavorites/:userId              // Should be part of User aggregate

// userLocationRoutes.js
/userlocation/:userId               // Should be part of User aggregate

// friendshipRoutes.js
/:userId/friends/*                  // User Relationships (loosely related)
```

**Impact:**
- Cannot maintain aggregate consistency
- No transactional boundaries
- Complex API surface

### c) **Deal & Event Ambiguity**
```javascript
// ❌ Unclear what's an aggregate root

// dealRoutes.js
POST /deals/recurring                // Recurring Deal - sub-type or separate entity?

// eventRoutes.js
POST /events/recurring               // Recurring Event - same pattern

// No clear distinction between recurring and non-recurring
// No clear parent-child relationships
```

**Question:** Is a recurring deal a separate entity or a deal type? DDD should make this explicit.

---

## 4. ⚠️ Inconsistent Command/Query Separation

**Violations:**

| Route | Issue |
|-------|-------|
| `POST /userfavorites/toggle` | Unclear: Is this a read-modify-write or just toggle? Should be explicit in design |
| `POST /userlocation/:userId/ghost` | Mixes location data with ghost mode - unclear aggregation |
| `PATCH /userlocation/:userId/preference` | Uses PATCH for state change instead of POST command |
| `POST /locationhours/:locationId/overrides` | Resource creation but `PUT /locationhours/:locationId/weekly` is for update |
| `POST /:userId/friends/:friendId` | Creation semantics unclear (request, block, or remove?) |

**Root Cause:** No explicit command/query definitions. Each route author decided their own HTTP method mapping.

**DDD Solution Needed:**
```javascript
// Clear, intent-based commands
POST /users/:userId/commands/send-friend-request
POST /users/:userId/commands/accept-friend-request
POST /users/:userId/commands/decline-friend-request
DELETE /users/:userId/commands/remove-friend/:friendId

// vs current
POST /:userId/friends/:friendId                      // unclear
POST /:userId/friends/:friendId/accept               // better
POST /:userId/friends/:friendId/decline              // good
DELETE /:userId/friends/:friendId                    // implies removal
```

---

## 5. ⚠️ Leaky Abstractions - Infrastructure Details in Controllers

**Violations in Controllers:**

```javascript
// ❌ Type coercion in controller (infrastructure detail)
const id = parseInt(req.params.id, 10);
if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

// ❌ Prisma error handling in controller
if (error.code === 'P2002') {
  return res.status(409).json({ error: "..." });
}

// ❌ Raw request body passed to service (no DTOs)
const deal = await dealService.createDeal(req.body);
```

**DDD Violation:** Controllers should not know about:
- Type coercion logic (should be in Value Objects)
- Database error codes (should be domain errors)
- Request structure (should be DTOs)

**Better Approach:**
```javascript
// Value Object encapsulates ID logic
class BannerId {
  constructor(value) {
    if (!Number.isInteger(value) || value < 1) throw new InvalidBannerIdError();
    this.value = value;
  }
}

// DTO layer handles request conversion
const bannerDTO = BannerDTO.fromRequest(req.body);

// Domain service handles business logic
const banner = await bannerService.create(bannerDTO);
```

---

## 6. ⚠️ Over-Granular Route Definitions

**Issue:** Too many micro-endpoints without clear use case grouping.

**Example - User Routes Complexity:**
```javascript
// 20+ routes mixing auth, profiles, preferences
GET /auth/status
POST /auth/register
GET /auth/check-username
GET /auth/username
PUT /auth/username
GET /auth/profile
GET /auth/roles
PUT /auth/bio
DELETE /auth/account
DELETE /auth/cancel-registration
GET /
GET /:userId/friends
GET /:id
PUT /:id
GET /profile/favorite-drinks
GET /profile/favorite-drinks/:id
GET /profile/photo-options
GET /profile/photo-options/:id
```

**DDD Issues:**
- No clear separation of **User** (core aggregate) from **UserProfile** (value object)
- Auth operations mixed with profile operations
- Preference/setting operations scattered

**Solution:** Group by bounded context
```javascript
// User Aggregate Routes
GET /users/:id
PUT /users/:id

// User Profile (part of User aggregate)
PUT /users/:id/profile/bio
PUT /users/:id/profile/photo
PUT /users/:id/profile/favorite-drink

// User Auth (separate bounded context)
POST /auth/register
POST /auth/logout
GET /auth/status
```

---

## 7. ⚠️ Missing Ubiquitous Language

**Current State:** Routes are CRUD-focused with generic names.

```javascript
POST /banners              // Generic
GET /deals/active          // Technical predicate
GET /users/auth/status     // Framework-specific
POST /userfavorites/toggle // Implementation detail exposed
```

**Should Be:** Domain language from business requirements

```javascript
// Domain Language Examples
POST /bars/activate
GET /bars/trending
POST /users/register-for-tonight
POST /users/join-friend-group
GET /users/friend-requests-pending
POST /users/accept-friendship
```

**Missing Context:**
- What does "active" mean in business terms?
- What is the user trying to accomplish with "toggle favorite"?
- Is a "bar" different from "location" in the domain?

---

## Summary of Root Causes

| Cause | Impact | Affected Routes |
|-------|--------|-----------------|
| No domain entities | Cannot enforce invariants | All CRUD routes |
| Service layer = data access | Business rules scattered | All service calls |
| Infrastructure in routes | Hard to test, reuse | r2Routes |
| Fragmented aggregates | Impossible to maintain consistency | location*, user*, friendship* |
| No command definitions | Unclear operation semantics | All POST/PUT/PATCH routes |
| Type coercion in controllers | Leaky abstractions | All routes with param validation |
| Generic naming | No way to document domain knowledge | All routes |

---

## Immediate Actions

### Priority 1: Extract Domain Layer
- Create domain entities: `Banner`, `Deal`, `Event`, `Location`, `User`
- Create value objects: `BannerId`, `UserId`, `LocationId`, etc.
- Move validation logic from controllers to domain

### Priority 2: Define Aggregates
- Location Aggregate: Location + Hours + MenuItems
- User Aggregate: User + Settings + Favorites
- Friendship: Separate bounded context
- Bar Operations: Activity, Deals, Events (child aggregates)

### Priority 3: Implement Commands/Queries
- Replace generic CRUD with intent-based commands
- Define explicit queries for read operations
- Use Request/Response DTOs

### Priority 4: Isolate Infrastructure
- Extract r2Routes business logic to service layer
- Remove Prisma-specific error handling from controllers
- Move type coercion to value objects

### Priority 5: Clarify Ubiquitous Language
- Document domain terms in README or GLOSSARY
- Rename routes to match business language
- Update service names to reflect domain concepts

