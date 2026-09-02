# Photographer Personal Pages

## Purpose

Give each photographer (RBAC role `photographer`) a public personal page: profile
photo, bio, a list of alternate links (Instagram, SmugMug, etc.), and the photo
albums they've shot at their assigned bars. Photographers maintain their own
page content themselves through the existing admin portal.

## Background / constraints

- Photo albums are not database rows today — they're Cloudflare R2 folders
  named `<BarName> <MM-DD>`, discovered by listing bucket prefixes
  (`backend/src/routes/r2Routes.js`). There is currently no record of which
  photographer created a given album, only which bars a user is assigned to
  (`app.location_admins`).
- The existing `users.profile_photo_id` is a shared cartoon-avatar picker
  (`app.user_profile_photos`, e.g. `Boy_1.png`) used by the social/mobile app.
  It is not a real photo and is not reused here — the public page gets its own
  real photo upload.
- No historical backfill: Kirstyn (the first photographer, user id 87, granted
  access to Cy's Roost / Sips / Paddy's / Outlaws on 2026-09-02) has not
  uploaded any albums yet. Any albums that already exist for those bars predate
  her assignment and are intentionally left unattributed — the new
  `photo_albums` table starts empty and populates only from this point
  forward, as new albums are created.

## Data model (`app` schema, via Prisma)

### `photo_albums` (new)

Links an R2 album folder to the photographer who created it.

| column | type | notes |
|---|---|---|
| id | serial PK | |
| folder_name | varchar, unique | matches the R2 folder key exactly |
| location_id | int, FK → `locations` | |
| photographer_id | int, FK → `users` | |
| created_at | timestamptz, default now() | |

Row is inserted the first time `POST /api/r2/upload-urls` is called for a
folder name that has no existing row, attributing it to the caller — but only
when the caller's role is `photographer` (admin/developer-created albums stay
unattributed; they have no public page to attach to). Row is deleted when its
album is deleted (`DELETE /api/r2/albums`).

### `photographer_links` (new)

Arbitrary alternate links for a photographer's page (Instagram, SmugMug, etc).

| column | type | notes |
|---|---|---|
| id | serial PK | |
| user_id | int, FK → `users`, `onDelete: Cascade` | |
| label | varchar | e.g. "Instagram" |
| url | varchar | |
| sort_order | int, default 0 | display order |

Saved via delete-all-then-reinsert on each edit (simple, no need for
per-link diffing at this scale).

### `users.photographer_photo_url` (new column)

Nullable `varchar(512)`, following the same "store the R2 object path"
convention as `banners.image_url` / `user_profile_photos.image_url`. Holds the
public-page photo, independent of `profile_photo_id`.

## Backend API

All new routes live alongside the existing photographer/R2 routes and reuse
`userService.getUserRolesByAuth0Id` for role checks, matching the existing
`r2Routes.js` conventions.

### Public (no auth)

**`GET /api/photographers/:username`**
404 if no user has that username, or their `role_id` isn't `photographer`.
Otherwise:
```json
{
  "name": "Kirstyn Henningsen",
  "bio": "...",
  "photoUrl": "https://.../photographer-photos/87.jpg",
  "links": [{ "label": "Instagram", "url": "https://instagram.com/..." }],
  "albums": [
    { "folder": "Outlaws 09-06", "barName": "Outlaws", "date": "09/06", "coverUrl": "..." }
  ]
}
```
Albums are read from `photo_albums` filtered by `photographer_id`, joined to
`locations` for the bar name, then a cover image is resolved per folder the
same way the existing `GET /api/r2/albums` does today (first image object,
signed URL).

### Authenticated (self only)

- **`GET /api/photographers/me`** — current bio/links/photo, for the edit form.
- **`PATCH /api/photographers/me`** — body `{ bio, links: [{label, url}] }`;
  updates `users.bio` and replaces the caller's `photographer_links` rows.
- **`POST /api/photographers/me/photo`** — returns a presigned R2 PUT URL
  (same pattern as `POST /api/r2/upload-urls`), and updates
  `users.photographer_photo_url` to the resulting key once the client reports
  the upload finished — matching how album uploads already work (no separate
  server-side confirm step today).

All three require role `photographer` (or `developer`, for support purposes)
and operate on the caller's own row only — there is no "edit someone else's
page" capability in this iteration.

### Modified existing endpoints

- **`POST /api/r2/upload-urls`** — after validating the folder as today, if no
  `photo_albums` row exists for `folder`, insert one
  (`location_id` resolved from the matched bar, `photographer_id` = caller),
  but only when the caller's role is `photographer`.
- **`DELETE /api/r2/albums`** — also deletes the matching `photo_albums` row
  (if any) for the deleted folder.

## Frontend (`ames-after-dark-admin-portal`)

### Public page: `/photographers/:username`

New route added to `App.jsx`, rendered outside `RoleContext`'s auth gate — no
login required to view. Layout: photo + name + bio at the top, links as a row
of buttons, then albums grouped by bar, reusing the existing album-grid /
lightbox presentation from `pages/Photographer.jsx`. Styled with the portal's
existing utility classes (`a-btn`, `a-h1`, `a-empty`, etc.) — no new design
system.

### Self-edit UI: "My Profile" section on the existing `/photographer` page

Visible only to the logged-in photographer viewing their own portal page.
Form fields: bio (textarea), photo (upload + preview), and a repeatable list
of link rows (label + URL, add/remove, drag-free — reordering via up/down or
just list order). Saves through the Section B endpoints. Includes a "View my
public page" link to `/photographers/:username`.

## Testing

- Backend: unit tests for the new/modified route handlers following the
  existing patterns in `backend/src/services/__tests__` /
  `backend/src/routes/__tests__` (role checks, 404 on unknown/non-photographer
  username, `photo_albums` insert-once-per-folder behavior, cascade delete on
  album deletion, link replace-on-save semantics).
- Frontend: manual verification in a browser — public page renders logged out,
  self-edit form saves and reflects on the public page, upload flow works
  end-to-end against dev R2/dev DB.
- No historical data migration to test — the feature is additive and starts
  from an empty `photo_albums` table.
