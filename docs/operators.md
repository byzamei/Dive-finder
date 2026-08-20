# Dive centers & liveaboards

Real, bookable operators — dive centers and liveaboards — shown on each
destination page, added post-V1 at the product owner's explicit request
("de vrais résultats possibles pour des réservations"). Same governance
rules as the rest of the app apply, with one addition specific to this
domain: **no appearance of favoritism**.

## No favoritism, by construction

- Operators are always listed **alphabetically** by name
  (`operatorService.ts`'s `list*ForDestination` functions `order("name")`)
  — never by price, by how recently they were added, or any relevance
  score. There is no "featured" or "sponsored" flag anywhere in the schema
  or the UI.
- Outbound links are the operator's own official URL, unmodified — no
  affiliate parameters, no tracking redirect through DiveFinder's own
  domain. DiveFinder earns nothing from a click or a booking.
- DiveFinder never books directly. A real integrated booking flow would
  need a commercial partnership (and API access) with each operator, or
  with an aggregator platform (Liveaboard.com, etc.) — out of scope here,
  and not something to build without that real relationship in place.

## Where the data comes from

Both `dive_centers` and `liveaboards` existed in the schema since V1
(`0006_operators_commerce.sql`) but had no seed data and no UI — the
tables were designed but never populated. Populating them honestly means
sourcing every entry from a real, checkable place:

- **Only an operator's own official website counts as a source.**
  Aggregator/directory sites (Liveaboard.com, PADI's dive shop locator,
  SSI's center finder, TripAdvisor, etc.) are never scraped or
  republished — their listings are each platform's own commercial
  database, and their terms of service generally forbid exactly that. They
  can be used only to *discover a name*, never as the cited source for a
  claim.
- Every operator gets its own `data_sources` row (`source_type:
  'official_operator'`, `url` = their site, `reliability: 'high'` since
  it's first-party) and a `data_claims` row citing it — same pattern as
  every other sourced fact in the app (see `docs/data-governance.md`).
- If a price isn't clearly and publicly stated on the operator's own site,
  it's left unset — never estimated or guessed.
- `dive_centers` and `liveaboards` both carry a `unique (destination_id,
  name)` constraint (`0015_operator_unique.sql`) so re-running the
  populate/refresh SQL is idempotent (`on conflict (destination_id, name)
  do update`) instead of creating duplicates.

## Booking roadmap

Real payments/inventory require a commercial relationship with each
operator first — building that before any partnership exists would mean
either faking availability or silently routing money through an
unauthorized channel. Three phases:

1. **Personal tracker (now)** — `/reservations`: divers manually record
   trips they've booked directly with an operator, tagged with a
   destination and (optionally) the operator's name. DiveFinder doesn't
   touch the booking or the money.
2. **Request to book** — once at least one real partnership exists, a
   "request to book" button on that operator's card sends an inquiry
   (email/API) instead of a real-time confirmation; the diver still
   finalizes with the operator directly.
3. **Full booking** — real-time availability and payment, once enough
   operators are integrated to make it worth building — otherwise it's a
   sparsely-covered feature that misleads divers into thinking coverage is
   broader than it is.

## Keeping it current: the weekly refresh routine

A weekly scheduled job re-researches each destination for new or changed
listings (new liveaboard itineraries, a dive center that's closed, a price
that changed) using the same sourcing rule above, and produces a dated,
ready-to-paste SQL file rather than writing to the database directly —
this environment has no network path to the live Supabase project, so a
human paste step into the SQL Editor is unavoidable regardless of how the
research itself is automated. See the Routine named "DiveFinder weekly
operator refresh" for the schedule; it notifies the product owner when a
new batch is ready to review and paste.

## Code map

- `src/lib/services/operatorService.ts` — reads `dive_centers`,
  `liveaboards`, and their `prices`, always name-sorted.
- `src/components/operators/OperatorsList.tsx` — the two list sections on
  the destination page.
- `supabase/migrations/0014_liveaboard_website.sql` — `liveaboards`
  had no outbound link column before this; added one.
- `supabase/migrations/0015_operator_unique.sql` — uniqueness for
  idempotent weekly upserts.
- `src/lib/services/reservationService.ts`,
  `src/components/reservations/ReservationsBoard.tsx`,
  `supabase/migrations/0017_reservations.sql` — Phase 1 of the booking
  roadmap above.
