# Table Reservations & Party/Event Requests

## Purpose

Let a customer reserve a table at a bar directly from the app, and
separately let them request a larger private booking (a graduation party,
etc.) that the bar owner reviews and responds to. This is a future feature
(not scheduled for this build) — this spec exists so the design is on
record and ready to hand to an implementation plan whenever it's picked up.

Money is explicitly out of scope: this is a reservation system, not a
payment system. The app books the slot or forwards the request; the
customer and the bar settle payment directly, the same way they already do
today with no reservation feature at all. This was a deliberate choice
(see "Payments" below) to avoid Stripe Connect onboarding per bar,
deposit/refund/no-show financial disputes, and PCI scope, none of which
this project needs to take on to deliver the actual value here (not
walking into a full bar, or a graduation party landing on a night the bar
can't accommodate it).

## Background / constraints

- No reservation-related code, schema, or UI exists anywhere in either
  repo today — this is a new subsystem, not a change to an existing flow.
- Every existing per-bar admin feature (deals, events, hours, menu) is
  scoped through `location_admins` (which bar a given admin user manages)
  and exposed as its own section of the admin portal. Reservations follow
  the same shape: a bar owner only sees and manages their own bar's
  settings, reservations, and party requests.
- This project has been bitten twice already by day-of-week and timezone
  handling done casually (`app.weekdays` numbering, and the
  `event_occurrences` UTC-storage bug from 2026-09-04). Reservation slot
  times **must** be stored as genuine UTC instants (computed from the
  bar's `timezone` column via `luxon`, the same fix already applied to
  `event_occurrences`), not local digits with a UTC label. This is called
  out explicitly so a future implementation doesn't repeat either mistake.
- No push-notification delivery pipeline exists in this codebase today.
  `frontend/app/(app)/(tabs)/account/notifications.tsx` is a settings
  screen only — there's no Expo push token registration, no stored device
  tokens, and no backend code that sends a push notification anywhere.
  Building that is a real, separate subsystem (device token capture on
  login, a token table, and an Expo push API call on the backend). This
  spec does **not** include it — v1 surfaces reservation/request status
  changes only inside the app itself (a "My Reservations" /
  "My Requests" screen the customer checks), and party-request
  notifications to the bar owner rely on them checking the admin portal.
  Push delivery is a natural follow-up enhancement once that
  infrastructure exists, not a blocker to shipping this.

## Two distinct flows

Table reservations and party requests are deliberately separate features
sharing a data model shape, not one generic "reservation" form:

|                  | Table reservation                | Party/event request              |
|------------------|-----------------------------------|-----------------------------------|
| Who decides      | Automatic (capacity check only)   | Bar owner (approve/decline/message) |
| Response time    | Instant                          | Whenever the owner responds        |
| Typical size     | Within the bar's configured max   | Above that max (large groups)      |
| Terms/deposit    | None — just a seat                | Negotiated directly, off-app       |

## Data model (`ames-after-dark` repo, `app` schema)

Four new tables. All timestamps follow the `event_occurrences` convention:
genuine UTC instants, computed from the location's `timezone`.

### `reservation_settings`
One row per location, created when a bar owner opts in. A location with no
row here simply doesn't show a reservation option in the app.

- `location_id` (FK, unique) — one settings row per bar
- `enabled` (boolean)
- `slot_interval_minutes` (int, e.g. 30) — granularity of bookable times
- `capacity_per_slot` (int) — total guests the bar can seat per slot via
  reservation (not the bar's total capacity — just what they're willing to
  hold for reservations)
- `max_party_size` (int) — above this, the app routes the customer to the
  party-request form instead of instant booking
- `last_reservation_minutes_before_close` (int, default 60) — stop
  offering slots too close to close; reservations are otherwise offered
  across the bar's existing `location_hours` rather than a second,
  separately-maintained schedule. Slot generation must reuse the
  day-of-week-aware, overnight-safe schedule resolution already built for
  open/closed status (`resolveScheduleStatus` in
  `frontend/services/barsService.ts`, and its backend equivalent) rather
  than re-deriving "is this bar open at this time" a third time — this
  project has already shipped that exact bug twice.
- `min_party_request_notice_days` (int, default 7) — earliest a party
  request can be submitted for
- `cancellation_policy_text` (string, nullable) — shown to the customer at
  booking time; informational only, nothing to enforce since no payment is
  collected

### `table_reservations`
- `id`, `location_id` (FK), `user_id` (FK) — reservation requires a
  logged-in account, same as every other account-gated action in this app
- `party_size` (int)
- `start_time_utc`, `end_time_utc` (Timestamptz) — `end_time_utc` is
  `start_time_utc + slot_interval_minutes`, stored explicitly rather than
  recomputed, so a later change to a bar's `slot_interval_minutes` doesn't
  retroactively resize existing bookings
- `status` (`confirmed` | `cancelled` | `no_show`) — `no_show` is set
  manually by the bar owner after the fact, for their own record-keeping
  only; nothing automated depends on it
- `created_at`, `cancelled_at` (nullable)

### `party_requests`
- `id`, `location_id` (FK), `user_id` (FK)
- `requested_date` (date)
- `preferred_start_time` (string, nullable, "HH:MM") — approximate; a
  graduation party's exact start time is often still in flux at request
  time
- `estimated_headcount` (int)
- `details` (text) — free-form: catering, AV, budget, whatever the
  customer wants to volunteer
- `contact_phone`, `contact_email` (string, nullable) — so the bar can
  reach the customer directly to negotiate, outside the app, once details
  get specific
- `status` (`pending` | `approved` | `declined`)
- `owner_response_message` (text, nullable) — a single reply, not a
  threaded chat (matches the "Approve/Decline/Message" choice as one
  response, not an in-app negotiation thread — further back-and-forth
  happens via the contact info already exchanged)
- `responded_by` (FK to `users`, nullable), `responded_at` (nullable)
- `created_at`

### `location_admins` (existing table — no change)
Reused as-is for scoping which admin user can manage a given bar's
reservation settings and see its requests, exactly like deals/events today.

## Backend API (`ames-after-dark` repo)

### Customer-facing (auth required for anything that writes)
- `GET /api/reservations/settings/:locationId` — public; whether this bar
  takes reservations at all, and the party-size cutoff, so the app knows
  which button to show
- `GET /api/reservations/availability?locationId=&date=` — public; computes
  open slots for that date (bar's `location_hours` for that weekday, minus
  `last_reservation_minutes_before_close`, minus any slot already at
  `capacity_per_slot` from existing `confirmed` reservations)
- `POST /api/reservations` — auth required; body: `location_id`,
  `start_time_utc`, `party_size`. Re-validates capacity server-side at
  write time (never trust a client-computed "this slot is open") to close
  the obvious race between two customers booking the last seats at once —
  the last writer to hit the capacity check loses and gets a 409, told to
  pick another slot.
- `DELETE /api/reservations/:id` — auth required, owner-of-reservation only
- `GET /api/reservations/mine` — auth required

- `POST /api/party-requests` — auth required
- `GET /api/party-requests/mine` — auth required

### Admin-facing (bar owner; scoped via `location_admins`, same pattern as
existing deal/event admin routes)
- `GET /api/admin/reservations/settings/:locationId`,
  `PUT /api/admin/reservations/settings/:locationId`
- `GET /api/admin/reservations?locationId=&date=` — the day's booked
  headcount, for the owner to plan staffing
- `GET /api/admin/party-requests?locationId=`
- `PATCH /api/admin/party-requests/:id` — body: `status`
  (`approved`/`declined`) and optional `owner_response_message`

## Frontend

### Mobile app (`ames-after-dark` repo)
- Bar detail screen gains a "Reserve a Table" button when
  `reservation_settings.enabled` is true, opening a date → time-slot →
  party-size picker fed by the availability endpoint; a party size over
  `max_party_size` swaps the button to "Request a Party/Event" instead of
  offering a slot.
- New "My Reservations" screen (account section) listing upcoming/past
  table reservations and party requests with their current status, since
  there's no push notification to tell the customer a party request was
  approved — they check here.

### Admin portal (`ames-after-dark-admin-portal` repo)
- New "Reservations" section per bar, alongside the existing
  Deals/Events/Hours/Menu editors: a settings form (the
  `reservation_settings` fields), a day-by-day reservation list, and a
  party-request queue with Approve / Decline / Message actions.

## Out of scope (v1)

- Payments, deposits, Stripe Connect — confirmed direction is
  reservation-only; the bar and customer settle directly.
- Push notifications — no delivery infrastructure exists yet; status is
  visible in-app only (see Background/constraints).
- Named tables/floor plans — capacity is a single pool per time slot, not
  per-table assignment; revisit only if a bar owner actually needs seating
  chart control.
- Automated no-show penalties or waitlists.
- In-app threaded negotiation for party requests — one owner response
  message, further details go through the exchanged contact info.

## Testing

- Backend: unit tests per the existing `services`/`controllers`
  `__tests__` convention — capacity-check math (including the race-losing
  409 case), slot generation against `location_hours` +
  `last_reservation_minutes_before_close`, and admin-route location
  scoping (an admin for bar A cannot see or act on bar B's requests,
  mirroring existing deal/event admin-route tests).
- Frontend: manual verification in both apps, matching this project's
  existing pattern (no automated UI test suite for either frontend beyond
  targeted unit tests).
- No data migration for existing data — purely additive new tables.
