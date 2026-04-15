# 🚀 START HERE - Your DDD Implementation Guide

Welcome! This file guides you through the DDD architecture implementation for your Ames After Dark backend.

---

## What Happened?

Your backend was refactored from a legacy architecture to **Domain-Driven Design (DDD)** because:

✅ **Before**: Business logic scattered everywhere, tightly coupled, hard to test
✅ **After**: Clean layers, testable, reusable, scalable, industry best practices

---

## What You Need to Know (2-minute overview)

### The 5 Layers (like a wedding cake 🎂)

```
🍰 Layer 1: Controllers (HTTP requests come in)
    ↓
🎂 Layer 2: Application Services (orchestrate use cases)
    ↓
🍰 Layer 3: Domain (business logic lives here)
    ↓
🎂 Layer 4: Infrastructure (database stuff)
    ↓
🍰 Layer 5: Shared (base classes for everyone)
```

**Key Rule**: Data flows DOWN, dependencies never go UP ⚠️

### What's Already Done ✅

```
2 Domains Refactored:
  ✅ Location (with coordinates, views, status)
  ✅ User (with profile, favorites, friends, streaks)

9 Domains Need Refactoring:
  ⏳ Event, Deal, Friendship, Banner, UserLocation
  ⏳ MenuItem, LocationHour, UserSetting, UserFavorite
```

---

## Your Checklist (Do These Now)

### 1️⃣ Read the Documentation (1.5 hours)

Open these files in order. You don't need to memorize - just understand:

- [ ] **DDD_VIOLATIONS_ANALYSIS.md** (15 min)
  - _Why_ the old code was bad
  - What _before/after_ patterns look like
  
- [ ] **REFACTORING_ROADMAP.md** (30 min)
  - How _to_ refactor each domain
  - Step-by-step with code examples
  
- [ ] **DDD_QUICK_REFERENCE.md** (20 min)
  - Keep this OPEN while coding
  - Your daily lookup guide
  
- [ ] **Review the Examples** (25 min)
  ```
  src/controllers/DDD-LocationController.js
  src/controllers/DDD-UserController.js
  src/application/services/LocationApplicationService.js
  src/domain/entities/Location.js
  ```
  - These are your templates for new domains

### 2️⃣ Use the Right Tools for the Job

**For Planning**: 
- [ ] `PHASE3_CHECKLIST.md` - Print this! Check off as you go

**For Implementing**:
- [ ] `REFACTORING_ROADMAP.md` - Open in split screen
- [ ] `DDD_QUICK_REFERENCE.md` - Keep as reference tab

**For Tracking**:
- [ ] `MIGRATION_PROGRESS.md` - Update weekly

**For Understanding**:
- [ ] `IMPLEMENTATION_SUMMARY.md` - Big picture overview

### 3️⃣ Start Your First Refactoring (3 hours)

**Recommended First Domain**: EVENT

Why? It's frequently used and relatively straightforward.

**Steps**:
1. Open `REFACTORING_ROADMAP.md`
2. Follow the "Event Domain Example" (10 steps)
3. Code alongside - copy the patterns, adapt for Event
4. Reference `DDD-LocationController.js` for patterns
5. Test all endpoints when done
6. Check off Domain 1 in `PHASE3_CHECKLIST.md`

**Time**: ~3 hours for complete Event domain

**Reality Check**: 
- First domain: 3 hours (you're learning)
- Subsequent domains: 1-2 hours each (you've got the pattern)

---

## The Pattern You'll Follow (For Every Domain)

### 10-Step Template (Repeat for each domain)

```
STEP 1: Create Aggregate (Domain Layer)
  └─ src/domain/entities/[Domain].js

STEP 2: Create Events (Domain Layer)
  └─ src/domain/events/[Domain]Events.js

STEP 3: Create Repository Interface (Domain Layer)
  └─ src/domain/repositories/I[Domain]Repository.js

STEP 4: Create Prisma Repository (Infrastructure Layer)
  └─ src/infrastructure/repositories/Prisma[Domain]Repository.js

STEP 5: Create DTOs (Application Layer)
  └─ src/application/dtos/[Domain]DTO.js

STEP 6: Create Application Service (Application Layer)
  └─ src/application/services/[Domain]ApplicationService.js

STEP 7: Create DDD Controller (Presentation Layer)
  └─ src/controllers/DDD-[Domain]Controller.js

STEP 8: Update Service Container (Infrastructure Layer)
  └─ src/infrastructure/ServiceContainer.js

STEP 9: Update Routes (Routes Layer)
  └─ src/routes/[domain]Routes.js

STEP 10: Test All Endpoints
  └─ Verify all HTTP calls work correctly
```

**Example**: For Event domain, follow these 10 steps with Event-specific logic.

---

## File Structure You'll Create

```
backend/src/
├── domain/
│   ├── entities/
│   │   ├── Location.js       ✅ Done
│   │   ├── User.js           ✅ Done
│   │   ├── Event.js          ⏳ Next
│   │   ├── Deal.js           ⏳ TODO
│   │   └── ...
│   ├── events/
│   │   ├── LocationEvents.js ✅ Done
│   │   ├── UserEvents.js     ✅ Done
│   │   ├── EventEvents.js    ⏳ Next
│   │   └── ...
│   ├── value-objects/
│   │   ├── Coordinates.js    ✅ Done
│   │   ├── TimeRange.js      ✅ Done
│   │   ├── Email.js          ✅ Done
│   │   └── Money.js          ✅ Done
│   └── repositories/
│       ├── ILocationRepository.js     ✅ Done
│       ├── IUserRepository.js         ✅ Done
│       ├── IEventRepository.js        ⏳ Next
│       └── ...
│
├── application/
│   ├── services/
│   │   ├── LocationApplicationService.js  ✅ Done
│   │   ├── UserApplicationService.js      ✅ Done
│   │   ├── EventApplicationService.js     ⏳ Next
│   │   └── ...
│   └── dtos/
│       ├── LocationDTO.js   ✅ Done
│       ├── UserDTO.js       ✅ Done
│       ├── EventDTO.js      ⏳ Next
│       └── ...
│
├── infrastructure/
│   ├── repositories/
│   │   ├── PrismaLocationRepository.js ✅ Done
│   │   ├── PrismaUserRepository.js     ✅ Done
│   │   ├── PrismaEventRepository.js    ⏳ Next
│   │   └── ...
│   ├── EventPublisher.js      ✅ Done
│   └── ServiceContainer.js    ✅ Done
│
├── controllers/
│   ├── DDD-LocationController.js ✅ Done
│   ├── DDD-UserController.js     ✅ Done
│   ├── DDD-EventController.js    ⏳ Create next
│   └── ...
│
└── shared/
    ├── BaseEntity.js        ✅ Done
    ├── BaseValueObject.js   ✅ Done
    ├── AggregateRoot.js     ✅ Done
    └── DomainEvent.js       ✅ Done
```

---

## Code You'll Write (Event Example)

### Event Aggregate (Step 1)
```javascript
// src/domain/entities/Event.js
class Event extends AggregateRoot {
  static create(id, title, description, startTime, endTime, locationId) {
    const event = new Event(id, title, description, startTime, endTime, locationId);
    event.publishEvent(new EventCreatedEvent(id, title, locationId));
    return event;
  }

  recordAttendee() {
    this.attendeeCount += 1;
    this.publishEvent(new EventAttendeeAddedEvent(this.id));
  }

  toObject() {
    return { id: this.id, title: this.title, ... };
  }
}
```

### Application Service (Step 6)
```javascript
// src/application/services/EventApplicationService.js
class EventApplicationService {
  async createEvent(dto) {
    dto.validate(); // Validate input
    const event = Event.create(...); // Create aggregate
    const saved = await this.repository.save(event); // Save
    this.eventPublisher.publish(saved.getUncommittedEvents()); // Publish events
    return EventResponseDTO.fromDomain(saved); // Return DTO
  }
}
```

### Controller (Step 7)
```javascript
// src/controllers/DDD-EventController.js
async createEvent(req, res) {
  try {
    const dto = new CreateEventDTO(...);
    const event = await this.eventService.createEvent(dto);
    res.status(201).json(event);
  } catch (err) {
    if (err.message.includes('required')) {
      res.status(400).json({ message: err.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
```

That's the pattern! Repeat for each domain.

---

## Timeline

### This Week
- [ ] **Monday**: Read documentation (1.5 hours)
- [ ] **Tuesday-Wednesday**: Refactor Event domain (3 hours) - Follow REFACTORING_ROADMAP.md
- [ ] **Thursday**: Refactor Deal domain (2.5 hours) - Now you know the pattern!

### Next Week
- [ ] Complete remaining 7 domains
- [ ] Time drops to 1-2 hours per domain after Event

### Total Time for Full Phase 3
- **~15-18 hours** of focused coding
- **Realistic**: 1-2 weeks with part-time development

---

## Common Mistakes to Avoid ⚠️

### ❌ DON'T
```javascript
// ❌ Don't call repository directly from controller
const raw = await prisma.locations.findMany();

// ❌ Don't skip DTO validation
async create(req, res) {
  const location = await service.create(req.body); // No validation!
}

// ❌ Don't forget to publish events
const saved = await repo.save(aggregate);
// Missing: this.eventPublisher.publish(saved.getUncommittedEvents());

// ❌ Don't mix business logic in different layers
// Service doing aggregate logic
await prisma.locations.update({ views: views + 1 });
```

### ✅ DO
```javascript
// ✅ Use application services
const service = getServiceContainer().getLocationService();
const locations = await service.getAllLocations();

// ✅ Always validate with DTOs
const dto = new CreateLocationDTO(...);
dto.validate();
const location = await service.create(dto);

// ✅ Always publish events
const saved = await repo.save(aggregate);
saved.getUncommittedEvents().forEach(event => 
  this.eventPublisher.publish(event)
);

// ✅ Put business logic in aggregates
location.recordView(); // Aggregate method
await repo.save(location); // Entire aggregate saved
```

---

## Success Indicators

✅ You're doing it right if:
- [ ] New controller uses ServiceContainer to get service
- [ ] DTOs validate all inputs
- [ ] Aggregate publishes events from methods
- [ ] Repository maps between raw DB and aggregate
- [ ] Application service orchestrates everything
- [ ] All endpoints return proper status codes (201, 404, 400, 500)
- [ ] Events publish to EventPublisher
- [ ] No direct Prisma calls in controllers

---

## Need Help?

### If You Get Stuck

1. **Check the quick reference**: `DDD_QUICK_REFERENCE.md` has FAQ
2. **Review the patterns**: Look at `DDD-LocationController.js` and `LocationApplicationService.js`
3. **Follow the roadmap**: `REFACTORING_ROADMAP.md` has complete Event example

### Common Issues

**Q**: Where do I put business logic?
**A**: In the aggregate (domain layer), not the service

**Q**: Should I validate in DTO or aggregate?
**A**: Format validation in DTO (email format), business rules in aggregate (age >= 21)

**Q**: Where do I publish events?
**A**: In the application service, after saving the aggregate

**Q**: Can an aggregate call another aggregate?
**A**: No - use an application service to coordinate them

---

## Your Next Steps (Right Now!)

### Immediate (Next 30 minutes)
1. Open this file: `DDD_VIOLATIONS_ANALYSIS.md`
2. Skim through it (don't memorize, just understand)
3. Look at one example: `src/domain/entities/Location.js`
4. Look at one service: `src/application/services/LocationApplicationService.js`

### Next (Today, 1.5 hours)
1. Read `DDD_QUICK_REFERENCE.md` - keep open while coding
2. Read `REFACTORING_ROADMAP.md` - your implementation guide
3. Print or open split-screen: `PHASE3_CHECKLIST.md`

### Then (Tomorrow, 3 hours)
1. Follow REFACTORING_ROADMAP.md steps 1-10 for EVENT domain
2. Create all Event files (aggregate, events, repository, service, dto, controller)
3. Update ServiceContainer and routes
4. Test all endpoints
5. Check off Event in PHASE3_CHECKLIST.md

---

## File Quick Links

**In backend/ directory**, read in this order:

1. **DDD_VIOLATIONS_ANALYSIS.md** ← Understanding problems
2. **REFACTORING_ROADMAP.md** ← How to refactor
3. **DDD_QUICK_REFERENCE.md** ← Keep open while coding
4. **PHASE3_CHECKLIST.md** ← Track progress

**Reference anytime**:
- **IMPLEMENTATION_SUMMARY.md** ← Big picture
- **MIGRATION_PROGRESS.md** ← Weekly check-in
- **DDD_IMPLEMENTATION_GUIDE.md** ← Deep reference

---

## Summary

### What You Have
✅ Complete DDD foundation with 2 example domains (Location, User)
✅ Comprehensive step-by-step guides
✅ Working code to copy patterns from
✅ Clear next steps

### What You Need to Do
⏳ Refactor 9 more domains following the pattern
⏳ Estimated: 3 hours Event + 2.5 hours Deal + 2 hours Friendship + 1 hour each for 6 others = ~18 hours total

### How to Succeed
1. ✅ Read the documentation (understand the why)
2. ✅ Study the examples (understand the how)
3. ✅ Follow the roadmap (implement step-by-step)
4. ✅ Use the checklist (track progress)
5. ✅ Test as you go (verify it works)

---

## 🎯 Bottom Line

You have:
- A working DDD foundation
- Clear examples to follow
- Step-by-step guides
- Time estimates for each domain

All you need to do now is **follow the pattern** for each remaining domain.

**Start with Event domain. Use REFACTORING_ROADMAP.md as your guide. You've got this! 💪**

---

**Questions?** Check DDD_QUICK_REFERENCE.md FAQ section

**Ready?** Let's go! 🚀

