# Phase 3 Implementation Checklist - Domain by Domain

Print this page and check off items as you complete them.

---

## READING ORDER (Do These First)

- [ ] Read: `DDD_VIOLATIONS_ANALYSIS.md` (15 min) - Understand problems
- [ ] Read: `REFACTORING_ROADMAP.md` (30 min) - Understand steps
- [ ] Read: `DDD_QUICK_REFERENCE.md` (20 min) - Keep open while coding
- [ ] Review: `src/controllers/DDD-LocationController.js` (15 min)
- [ ] Review: `src/controllers/DDD-UserController.js` (10 min)
- [ ] Glance at: `MIGRATION_PROGRESS.md` - Understand what's done

**Time**: ~1.5 hours

---

## DOMAIN 1: EVENT (Priority: HIGH - Estimated 3 hours)

### 1.1 Create Event Aggregate
- [ ] Create directory: `src/domain/entities/`
- [ ] Create: `src/domain/entities/Event.js`
- [ ] Copy structure from: `src/domain/entities/Location.js`
- [ ] Add Event-specific methods:
  - [ ] `recordAttendee()`
  - [ ] `updateDetails()`
  - [ ] `publish()` for event publishing
- [ ] Export Event class

**Reference**: REFACTORING_ROADMAP.md, Step 1: "Create the Aggregate"

### 1.2 Create Domain Events
- [ ] Create: `src/domain/events/EventEvents.js`
- [ ] Define events:
  - [ ] `EventCreatedEvent`
  - [ ] `EventUpdatedEvent`
  - [ ] `EventDeletedEvent`
  - [ ] `EventAttendeeAddedEvent`
- [ ] Each event extends `DomainEvent`
- [ ] Include: eventId, title, occurrence timestamp

**Reference**: REFACTORING_ROADMAP.md, Step 3

### 1.3 Create Repository Interface
- [ ] Create directory: `src/domain/repositories/`
- [ ] Create: `src/domain/repositories/IEventRepository.js`
- [ ] Define interface methods:
  - [ ] `findById(id)`
  - [ ] `findByLocationId(locationId)`
  - [ ] `findUpcoming(days)`
  - [ ] `findAll()`
  - [ ] `save(event)`
  - [ ] `delete(id)`

**Reference**: REFACTORING_ROADMAP.md, Step 4

### 1.4 Create Prisma Repository Implementation
- [ ] Create directory: `src/infrastructure/repositories/`
- [ ] Create: `src/infrastructure/repositories/PrismaEventRepository.js`
- [ ] Extend `IEventRepository`
- [ ] Implement all methods
- [ ] Add `toDomain()` method - raw DB to Event aggregate
- [ ] Add `toPersistence()` method - Event aggregate to raw DB data
- [ ] Test queries work

**Reference**: REFACTORING_ROADMAP.md, Step 5

**Verify**:
```javascript
// Should work
const repo = new PrismaEventRepository();
const event = await repo.findById(1);
console.log(event instanceof Event); // true
```

### 1.5 Create DTOs
- [ ] Create directory: `src/application/dtos/`
- [ ] Create: `src/application/dtos/EventDTO.js`
- [ ] Define classes:
  - [ ] `CreateEventDTO` with `validate()`
  - [ ] `UpdateEventDTO` with `validate()`
  - [ ] `EventResponseDTO` with `fromDomain()`
- [ ] Validation should check:
  - [ ] Title required and not empty
  - [ ] StartTime and EndTime required
  - [ ] EndTime > StartTime
  - [ ] LocationId required

**Reference**: REFACTORING_ROADMAP.md, Step 6

### 1.6 Create Application Service
- [ ] Create: `src/application/services/EventApplicationService.js`
- [ ] Constructor takes: `eventRepository`, `eventPublisher`
- [ ] Implement methods:
  - [ ] `getAllEvents()` - returns EventResponseDTO[]
  - [ ] `getEventById(id)` - returns EventResponseDTO
  - [ ] `getEventsByLocation(locationId)` - returns EventResponseDTO[]
  - [ ] `getUpcomingEvents(days)` - returns EventResponseDTO[]
  - [ ] `createEvent(dto)` - DTO validate, create aggregate, save, publish events
  - [ ] `updateEvent(id, dto)` - load, update, save, publish events
  - [ ] `deleteEvent(id)` - delete
  - [ ] `recordAttendee(eventId)` - call aggregate method, save, publish events
- [ ] All create/update/delete should:
  - [ ] Validate inputs (throw errors)
  - [ ] Publish events to eventPublisher
  - [ ] Return DTOs

**Reference**: REFACTORING_ROADMAP.md, Step 7

**Test manually**:
```javascript
const service = new EventApplicationService(repo, publisher);
const dto = new CreateEventDTO('Title', 'Desc', now, later, 1);
const result = await service.createEvent(dto);
console.log(result.id); // Should print ID
```

### 1.7 Create DDD Controller
- [ ] Create: `src/controllers/DDD-EventController.js`
- [ ] Copy structure from: `DDD-LocationController.js`
- [ ] Create methods (all with try-catch):
  - [ ] `getAllEvents(req, res)`
  - [ ] `getEventById(req, res)` - parse req.params.id
  - [ ] `getEventsByLocation(req, res)` - parse req.params.locationId
  - [ ] `getUpcomingEvents(req, res)` - parse req.query.days
  - [ ] `createEvent(req, res)` - create DTO, validate, call service
  - [ ] `updateEvent(req, res)` - create DTO, validate, call service
  - [ ] `deleteEvent(req, res)` - call service, return 204
  - [ ] `recordAttendee(req, res)` - call service, return updated DTO
- [ ] In constructor: `this.eventService = getServiceContainer().getEventApplicationService()`
- [ ] Error handling:
  - [ ] 400 for validation errors
  - [ ] 404 for not found
  - [ ] 500 for unexpected errors

**Reference**: REFACTORING_ROADMAP.md, Step 8

### 1.8 Update Service Container
- [ ] Open: `src/infrastructure/ServiceContainer.js`
- [ ] Add in class constructor:
  ```javascript
  const PrismaEventRepository = require('../repositories/PrismaEventRepository');
  const EventApplicationService = require('../../application/services/EventApplicationService');
  
  this.eventRepository = new PrismaEventRepository();
  this.eventApplicationService = new EventApplicationService(
    this.eventRepository,
    this.eventPublisher
  );
  ```
- [ ] Add method:
  ```javascript
  getEventApplicationService() {
    return this.eventApplicationService;
  }
  ```

**Reference**: REFACTORING_ROADMAP.md, Step 9

### 1.9 Update Routes
- [ ] Open: `src/routes/eventRoutes.js`
- [ ] Replace with:
  ```javascript
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

**Reference**: REFACTORING_ROADMAP.md, Step 10

### 1.10 Test All Endpoints
- [ ] Start server: `npm start`
- [ ] Test GET all: POST /api/events
- [ ] Test POST create: POST /api/events with body
- [ ] Test GET by location: GET /api/events/location/1
- [ ] Test GET upcoming: GET /api/events/upcoming?days=7
- [ ] Test PUT update: PUT /api/events/1 with body
- [ ] Test DELETE: DELETE /api/events/1
- [ ] Test record attendee: POST /api/events/1/attendees
- [ ] Verify response status codes (200, 201, 204, 400, 404)
- [ ] Verify error messages

**Time for Domain 1**: 3 hours ✓

---

## DOMAIN 2: DEAL (Priority: HIGH - Estimated 2.5 hours)

Use the same 10-step process as Event:

### 2.1 Create Deal Aggregate
- [ ] Create: `src/domain/entities/Deal.js`
- [ ] Methods: `updateDetails()`, `markActive()`, `markInactive()`, `calculateDiscount()`

### 2.2 Create Domain Events
- [ ] Create: `src/domain/events/DealEvents.js`
- [ ] Events: `DealCreatedEvent`, `DealUpdatedEvent`, `DealActivatedEvent`, `DealDeactivatedEvent`

### 2.3 Create Repository Interface
- [ ] Create: `src/domain/repositories/IDealRepository.js`
- [ ] Methods: `findById`, `findByLocationId`, `findActive`, `findAll`, `save`, `delete`

### 2.4 Create Prisma Repository
- [ ] Create: `src/infrastructure/repositories/PrismaDealRepository.js`

### 2.5 Create DTOs
- [ ] Create: `src/application/dtos/DealDTO.js`
- [ ] Classes: `CreateDealDTO`, `UpdateDealDTO`, `DealResponseDTO`

### 2.6 Create Application Service
- [ ] Create: `src/application/services/DealApplicationService.js`
- [ ] Methods: `getAllDeals`, `getDealById`, `getDealsByLocation`, `getActiveDeal`, `createDeal`, `updateDeal`, `deleteDeal`

### 2.7 Create DDD Controller
- [ ] Create: `src/controllers/DDD-DealController.js`
- [ ] Methods: corresponding to service methods

### 2.8 Update Service Container
- [ ] Add DealApplicationService and DealRepository

### 2.9 Update Routes
- [ ] Update: `src/routes/dealRoutes.js`

### 2.10 Test All Endpoints
- [ ] Verify all endpoints work

**Time for Domain 2**: 2.5 hours ✓

---

## DOMAIN 3: FRIENDSHIP (Priority: HIGH - Estimated 2 hours)

### 3.1 Create Friendship Aggregate
- [ ] Create: `src/domain/entities/Friendship.js`
- [ ] Consideration: Bidirectional relationship
- [ ] Methods: `accept()`, `reject()`, `remove()`

### 3.2 Create Domain Events
- [ ] Create: `src/domain/events/FriendshipEvents.js`
- [ ] Events: `FriendshipRequestedEvent`, `FriendshipAcceptedEvent`, `FriendshipRejectedEvent`, `FriendshipRemovedEvent`

### 3.3 Create Repository Interface
- [ ] Create: `src/domain/repositories/IFriendshipRepository.js`
- [ ] Methods: `findById`, `findByUsers`, `findPending`, `findAccepted`, `findAll`, `save`, `delete`

### 3.4 Create Prisma Repository
- [ ] Create: `src/infrastructure/repositories/PrismaFriendshipRepository.js`
- [ ] Handle bidirectional updates

### 3.5 Create DTOs
- [ ] Create: `src/application/dtos/FriendshipDTO.js`

### 3.6 Create Application Service
- [ ] Create: `src/application/services/FriendshipApplicationService.js`

### 3.7 Create DDD Controller
- [ ] Create: `src/controllers/DDD-FriendshipController.js`

### 3.8 Update Service Container
- [ ] Add FriendshipApplicationService

### 3.9 Update Routes
- [ ] Update: `src/routes/friendshipRoutes.js`

### 3.10 Test All Endpoints
- [ ] Verify all endpoints work

**Time for Domain 3**: 2 hours ✓

---

## DOMAIN 4: BANNER (Priority: MEDIUM - Estimated 1 hour)

Follow same 10-step process:

- [ ] 4.1 Create Aggregate
- [ ] 4.2 Create Events
- [ ] 4.3 Create Repository Interface
- [ ] 4.4 Create Prisma Repository
- [ ] 4.5 Create DTOs
- [ ] 4.6 Create Application Service
- [ ] 4.7 Create Controller
- [ ] 4.8 Update Service Container
- [ ] 4.9 Update Routes
- [ ] 4.10 Test Endpoints

**Time for Domain 4**: 1 hour ✓

---

## DOMAIN 5: USER_LOCATION (Priority: MEDIUM - Estimated 1 hour)

Follow same 10-step process:

- [ ] 5.1-5.10: Complete Event domain template for UserLocation

**Time for Domain 5**: 1 hour ✓

---

## DOMAIN 6: MENU_ITEM (Priority: MEDIUM - Estimated 1 hour)

Follow same 10-step process:

- [ ] 6.1-6.10: Complete Event domain template for MenuItem

**Time for Domain 6**: 1 hour ✓

---

## DOMAIN 7: LOCATION_HOUR (Priority: MEDIUM - Estimated 1 hour)

**Note**: Consider if this should be part of Location aggregate instead

- [ ] Decide: Separate aggregate or part of Location?
- [ ] If separate: Follow 10-step process
- [ ] If part of Location: Update LocationApplicationService

**Time for Domain 7**: 1 hour ✓ (or add to Location)

---

## DOMAIN 8: USER_SETTING (Priority: LOW - Estimated 1 hour)

Follow same 10-step process for UserSettings:

- [ ] 8.1-8.10: Complete Event domain template

**Time for Domain 8**: 1 hour ✓

---

## DOMAIN 9: USER_FAVORITE (Priority: LOW - Estimated 0.5 hours)

**Status**: Already implemented in User aggregate
- [ ] Verify User.favorites works
- [ ] Test favorite endpoints in UserApplicationService
- [ ] Verify events publish (LocationFavoritedEvent, LocationUnfavoritedEvent)

**Time for Domain 9**: 0.5 hours ✓

---

## FINAL STEPS: Routes & Cleanup

### Verify All Routes
- [ ] All controllers updated
- [ ] All routes use DDD controllers
- [ ] All middleware properly attached
- [ ] No legacy service calls remaining

### Testing All Endpoints
- [ ] Run full test suite
- [ ] Verify Swagger docs still work (http://localhost:3000/api-docs)
- [ ] Verify events publish to EventPublisher
- [ ] Verify error handling (400, 404, 500)

### Documentation Updates
- [ ] Update MIGRATION_PROGRESS.md - mark all as complete
- [ ] Update README.md if needed
- [ ] Verify all internal links work

### Cleanup
- [ ] Delete old service files from `src/services/` (after testing)
- [ ] Remove `src/db.js` (unused)
- [ ] Run linter: `npm run lint`
- [ ] Run any existing tests: `npm test`

---

## SUMMARY

### Time Breakdown
- **Phase 3 Reading**: 1.5 hours
- **Domain 1 (Event)**: 3 hours
- **Domain 2 (Deal)**: 2.5 hours
- **Domain 3 (Friendship)**: 2 hours
- **Domain 4 (Banner)**: 1 hour
- **Domain 5 (UserLocation)**: 1 hour
- **Domain 6 (MenuItem)**: 1 hour
- **Domain 7 (LocationHour)**: 1 hour
- **Domain 8 (UserSetting)**: 1 hour
- **Domain 9 (UserFavorite)**: 0.5 hours
- **Final steps**: 1 hour

**Total**: ~18 hours (for full Phase 3)

### Realistic Timeline
- **Per day** (8 hours coding): ~2.5 domains/day
- **2-3 days**: Complete Event + Deal + Friendship
- **4-5 days**: Complete all remaining domains
- **1 week**: Full Phase 3 complete

### Success Checklist
- [ ] All 11 domains refactored ✓
- [ ] All controllers using DDD pattern ✓
- [ ] All services using ApplicationServices ✓
- [ ] All DTOs validating input ✓
- [ ] All aggregates publishing events ✓
- [ ] All repositories using mappings ✓
- [ ] ServiceContainer wiring all services ✓
- [ ] All endpoints tested ✓
- [ ] Error handling consistent ✓
- [ ] MIGRATION_PROGRESS.md updated ✓

---

## 📋 Domains Refactoring Status

| # | Domain | Priority | Hours | Status | Notes |
|---|--------|----------|-------|--------|-------|
| 1 | Event | HIGH | 3 | ⏳ TODO | Start here |
| 2 | Deal | HIGH | 2.5 | ⏳ TODO | After Event |
| 3 | Friendship | HIGH | 2 | ⏳ TODO | After Deal |
| 4 | Banner | MEDIUM | 1 | ⏳ TODO | |
| 5 | UserLocation | MEDIUM | 1 | ⏳ TODO | |
| 6 | MenuItem | MEDIUM | 1 | ⏳ TODO | |
| 7 | LocationHour | MEDIUM | 1 | ⏳ TODO | Consider aggregate |
| 8 | UserSetting | LOW | 1 | ⏳ TODO | |
| 9 | UserFavorite | LOW | 0.5 | ✅ IN-PROGRESS | Already in User |
| 10 | Location | CORE | - | ✅ DONE | Reference |
| 11 | User | CORE | - | ✅ DONE | Reference |

---

**Created**: Today
**Current Phase**: 3 of 4
**Status**: Ready to Begin

**👉 NEXT ACTION**: Start Domain 1 (Event) - Use REFACTORING_ROADMAP.md as your step-by-step guide

