# Public Gallery Browsing

## Purpose

Let anonymous website visitors browse Ames After Dark event photos by bar,
without an account, while keeping bandwidth costs low (the project runs on
a free-tier hosting budget). Downloading a full-resolution photo requires a
logged-in account. This is the first of two sub-projects toward a public
web presence showcasing the app; the second (a content refresh of the
`amesafterdark.com` marketing site, linking into this gallery and into the
already-shipped photographer pages) is a separate, later effort and is not
covered by this spec.

## Background / constraints

- Album and photo *listing* is already public today: `GET /api/r2/albums`
  and `GET /api/r2/photos?prefix=...` (`backend/src/routes/r2Routes.js`)
  require no authentication and are already consumed by the mobile app's
  existing Gallery tab (`frontend/services/galleryService.ts`) — there is
  no separate "gallery backend" to build; this spec reuses those endpoints
  for listing and adds only what's missing: bandwidth-cheap previews and a
  login-gated download.
- `GET /api/photos` currently returns each photo's *full-resolution* signed
  R2 URL directly. If the new public web gallery rendered photos using
  that field as-is, anonymous browsing would cost full-resolution bandwidth
  for every viewer, and a visitor could right-click "Save Image" on that
  URL without ever logging in — defeating both the bandwidth goal and the
  account requirement. This spec's core addition is a preview layer that
  makes the bandwidth goal real: the gallery UI never renders or fetches
  that full-resolution field, only the new preview endpoint's cheap
  thumbnails.
  **Known limitation, accepted as a post-implementation finding (final
  review, 2026-09-03):** the account requirement is *not* fully closed by
  this design as shipped. `GET /api/photos` itself still returns each
  photo's full-resolution signed URL in its JSON response body regardless
  of caller — the gallery frontend simply doesn't use that field, but
  nothing stops an anonymous visitor from reading it directly from the
  network response (e.g. via browser devtools) and downloading the
  original without ever logging in. Closing this fully would require
  changing `GET /api/photos` itself (e.g. an opt-out flag omitting
  `image.uri`, or gating that field behind auth) — out of scope for this
  branch since that endpoint is shared with the mobile app's own Gallery
  tab. The bandwidth goal is unaffected (actual bytes transferred by the
  web gallery are the cheap previews); only the "must have an account to
  get the original" guarantee is softer than originally designed here.
- No bulk/zip download, and no attempt to verify the visitor has installed
  the mobile app — an existing Ames After Dark account (any role,
  including the default `user` role from normal app signup) is sufficient
  to download. This was evaluated and explicitly declined: the app doesn't
  yet request push notifications, so there's no existing signal to check.
- Thumbnails are generated lazily (on first public view) and cached in R2,
  not generated eagerly at upload time — this requires zero changes to the
  existing, already-shipped photo upload flow, and never spends compute on
  photos nobody views publicly.

## Backend API (`ames-after-dark` repo)

### New dependency

`sharp` (image resizing) — actively maintained, no license cost, ships
prebuilt native bindings for standard Linux x64, matching the Oracle Cloud
VM this backend runs on.

### `GET /api/gallery/preview?key=<R2 key>` (public, no auth)

Returns a signed URL to a small preview version of the given photo, in the
same response shape `signedUrlForKey` already produces elsewhere (`{ url:
"https://..." }`).

Behavior:
1. Reject (400) if `key` is missing or doesn't look like a real photo key
   under a known album folder (reuse `parseFolderName`/folder-shape
   validation patterns already in `r2Storage.js`/`r2Routes.js` — this
   endpoint must not become an arbitrary-R2-read proxy).
2. Derive the preview key by prefixing the filename with `thumb_`, mirroring
   the existing `hidden_` soft-delete convention (e.g.
   `Outlaws 09-06/_DSC1234.jpg` → `Outlaws 09-06/thumb__DSC1234.jpg`).
3. If an object already exists at the preview key (`HeadObjectCommand`,
   reusing the existing `objectExists` helper), sign and return its URL —
   no regeneration.
4. Otherwise: download the original via `GetObjectCommand`, resize with
   `sharp` to max width 700px (preserve aspect ratio, don't upscale smaller
   originals), re-encode as JPEG quality ~70 regardless of the original
   format (GIFs lose animation in their preview — acceptable), upload the
   result to the preview key, then sign and return its URL.

### Modify: photo listing must exclude preview files

`GET /api/r2/photos` (`r2Routes.js`) already filters out `hidden_`-prefixed
keys from its listing. Extend that same filter to also exclude
`thumb_`-prefixed keys, so a generated preview never shows up as if it
were a real photo in the album. (`GET /api/r2/albums`'s "most recently
modified" cover-picking logic must apply the same exclusion, or a freshly
generated preview could become an album's cover image.)

### `GET /api/gallery/download?key=<R2 key>` (requires login)

Requires a valid JWT (`checkJwt`) **and** a matching row in `app.users`
(any role — reuse `userService.getUserRolesByAuth0Id`; reject with 401 if
no matching user row exists, mirroring the `requirePhotographer` pattern's
"valid JWT, no app account yet" case elsewhere in this codebase, but
without the role restriction `requirePhotographer` adds).

Behavior: same key validation as the preview endpoint (reject anything not
shaped like a real photo key), then return a signed URL to the *original*
object with `ResponseContentDisposition: 'attachment; filename="<basename
of key>"'` set on the `GetObjectCommand` before signing, so the browser
downloads the file instead of navigating to it.

## Frontend (`ames-after-dark-admin-portal` repo)

Three new public routes, alongside the existing `/photographers/:username`
route (same pattern: outside `RoleProvider`'s auth gate, no login required
to view):

- **`/gallery`** — bar picker. Fetches `GET /api/locations` (already
  public), renders each bar as a card/link to `/gallery/:barName`.
- **`/gallery/:barName`** — album picker for that bar. Fetches `GET
  /api/r2/albums`, filters client-side to albums matching `:barName`
  (reuse the existing `barNamesMatch`/`normalizeBarName` pattern already
  duplicated between `Photographer.jsx` and the backend — this is a third
  copy of that matching logic; acceptable for now, matching existing
  precedent, but worth extracting to a shared helper if a fourth copy ever
  shows up), renders each album as a card linking to
  `/gallery/:barName/:albumId`.
- **`/gallery/:barName/:albumId`** — photo grid. Fetches `GET
  /api/r2/photos?prefix=<albumUri>` for the list of photo keys (using only
  each entry's `id`, ignoring the full-resolution `image.uri` it also
  returns), then renders each photo as `<img
  src="{API_BASE}/api/gallery/preview?key=<id>">`. Clicking a photo opens a
  lightbox-style enlarged preview (still the preview image, not full-res)
  with a "Download" button.
- **Download button behavior**: if the visitor isn't authenticated
  (`useAuth0().isAuthenticated`), trigger `loginWithRedirect()` first, then
  on return, or immediately if already authenticated, call `GET
  /api/gallery/download?key=<id>` with the bearer token and navigate the
  browser to the returned signed URL (triggering the browser's native
  save-file flow via the `Content-Disposition` header — no client-side
  blob handling needed).

Styling reuses the portal's existing `a-*` utility classes, matching every
other page in this app.

## Testing

- Backend: unit tests for the new/modified route handlers following this
  repo's existing patterns (`backend/src/controllers/__tests__/`,
  `backend/src/services/__tests__/`): preview-key derivation and the
  exists-vs-generate branch (mocking `sharp` and the S3 client, not
  actually resizing images in tests), the `thumb_`/`hidden_` exclusion in
  the photo-listing filter, and the download endpoint's auth/account
  checks (401 with no JWT, 401 with a JWT but no matching `users` row, 200
  with a valid account).
- Frontend: manual verification in a browser, matching how the
  photographer pages were verified — public browsing works logged out, the
  download button correctly prompts login when unauthenticated and
  succeeds after logging in.
- No data migration — this feature only adds new R2 objects (previews) and
  touches no database schema.
