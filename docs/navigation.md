# Navigation structure

Restructured post-V1 at the product owner's request, then simplified again
after user-testing feedback (a friend's outside review, relayed verbatim)
found the first restructure still asked people to sort themselves into a
category before they could do anything. The original nav had grown one
item at a time as features shipped (Discover, Wildlife, Map, Compare, Mask
Finder, Sites, Logbook, Saved…) until it had no organizing principle at
all; this groups by **journey stage** and removes every screen that forced
a choice the app didn't actually need.

## The five primary tabs

1. **Search** (`/search`, renamed from `/discover` — "Discover" tested as
   an unclear label) — the scored-wizard entry point, and now also the
   effective home page (`/` redirects straight here — the marketing landing
   page tested as pure friction with nothing on it people needed). `/discover`
   still resolves (redirects to `/search`) for any stale link. A single
   6-step scored wizard (dates → budget → level → wildlife → conditions →
   review); every step is skippable ("Skip to results" is always visible)
   so there's no need to pre-sort people into "search by animal / by date /
   by destination" before they even start — that used to be the wizard's
   first screen and was removed because it added a decision with no real
   effect (skipping steps already gets you to the same place). The first
   step (dates) also carries a Booking.com-style inspiration rail
   (`SearchInspiration.tsx`) — real destinations, and a real price when one
   exists (`getCheapestPricePerDestination`), but no photography: DiveFinder
   has no licensed destination/wildlife photos yet, so each card uses a
   gradient + a decorative marine-life icon instead of a stock photo
   pretending to be a real place. Submitting the wizard (or hitting "Skip
   to results" from any step) lands on `/results`, which is the
   Google-Flights-style split view described below, seeded with whatever
   criteria the wizard produced.
2. **Explore** (`/explore`) — a catalog, not a form. Three big tiles at the
   top mirror how people actually think about a trip — Destinations (by
   country/region), Animals (→ `/wildlife`), Season (reveals a month
   picker, each month linking straight to scored `/results` for that
   month) — the same three angles that used to gate Search's first screen,
   now offered as entry points instead of a mandatory choice. Dive sites
   are deliberately NOT a fourth peer tile: a destination can contain many
   sites, so conflating "destination" and "site" as equal browsing units
   would hide that hierarchy. Instead there's a distinctly-styled secondary
   card ("Looking for a specific dive site instead?" → `/sites`), and every
   destination card in the list shows its own site count. Below the tiles,
   the destination list itself has a List/Map toggle (reusing `MapView`/
   `MapLibreMap`) and a "Compare" checkbox per card (comparing used to be
   its own nav item — removed in favor of selecting inline, same pattern as
   the Results page). Explore stays a browsable catalog on purpose — it's
   the "I don't know what I want yet" surface; the live-filter/map combo
   lives on `/results` instead (see below), reached only after Search's
   questionnaire.

**`/results`** (not a primary tab — reached from Search) is the
Google-Flights-style split view: a filter panel + scrollable list on the
left, a persistent map on the right, both driven by the same filter state
at once (changing a filter updates the list AND the map together, no
"apply" step). Seeded from the criteria the Search wizard produced
(`?c=` in the URL), then freely adjustable right there — no need to redo
the whole questionnaire for a small change. The filters are literally
`SearchCriteria` — the same type and the same `searchDestinations()` call
the wizard itself uses — presented flat instead of stepped, so there's one
scoring/filtering engine behind both screens, not two that could quietly
drift apart. Shared between this page and nowhere else (for now) as
`src/components/results/FilteredExplorer.tsx`. Map pins show a price
label (`from €45`) when the destination has at least one real,
currently-listed operator price — the minimum observed price across its
own dive centers and liveaboards (`getCheapestPricePerDestination` in
`operatorService.ts`), never fabricated; a destination with no priced
operator yet just shows an unlabeled pin.
3. **Reservations** (`/reservations`) — a personal trip/booking tracker
   (upcoming/past/cancelled), Phase 1 of the booking roadmap in
   `docs/operators.md`: divers manually record trips they've booked
   elsewhere, tagged with a destination and (optionally) the operator's
   name. No payment or real-time inventory yet — that requires operator
   partnerships first (Phase 2/3). Deliberately distinct from **Logbook**:
   a reservation is a booking, a logbook entry is one dive; a reservation
   can contain many dives.
4. **Favorites** (`/saved`) — favorites/named lists. Route stayed `/saved`
   (established, widely linked) even though the label became "Favorites".
5. **Account** (`/profile`) — identity, badges, the diver profile form, and
   the **Logbook** (linked from a card on this page, not a top-level tab —
   it's inherently account-scoped, like Reservations and Favorites).

## Gear

`/gear` is a small hub (one card today: Mask Finder) reachable from the
main header, not buried inside Explore — gear tools aren't part of the
destination catalog, they're a different kind of thing, and the app is
expected to grow more of them over time.

## Soft-gating, not hiding

Personal tabs (Reservations, Favorites, Account) stay visible and
reachable to signed-out visitors instead of being hidden from the nav or
hard-redirected to `/login`. Tapping in shows what the feature is and a
sign-in prompt, rather than disappearing entirely or bouncing you away
with no context — same reasoning as the existing soft-gates on Mask
Finder's "save to profile" and the Wildlife life-list toggle. `/reservations`
follows this pattern; `/saved` and `/profile` still hard-redirect via
`requireUser()` from before this restructure — bringing them in line is a
reasonable follow-up, not done here.

## Files

- `src/components/nav/TopNav.tsx` — desktop, the 5 primary links (Search,
  Explore, Gear, Reservations, Favorites) + Account.
- `src/components/nav/BottomNav.tsx` — mobile, the 5 primary tabs (Gear
  doesn't get bottom-nav real estate — reachable via the mobile hamburger
  menu instead, to keep the bar from crowding).
- `src/components/nav/MobileHeader.tsx` — mobile hamburger menu, scoped to
  what isn't already one tap away via BottomNav: Wildlife, Dive sites, Gear.
- `src/app/explore/page.tsx` — the catalog: category tiles + destination
  list/map.
- `src/app/results/page.tsx` + `src/components/results/FilteredExplorer.tsx`
  — the live filter/map split view reached from Search.
- `src/components/discover/SearchInspiration.tsx` — the inspiration rail
  under Search's first step.
- `src/app/gear/page.tsx` — the Gear hub.
- `src/app/destinations/page.tsx`, `src/app/sites/page.tsx`, `src/app/map/page.tsx`
  — still exist as standalone routes (nothing links here as a primary
  nav item anymore, but they're not dead: `/map` embeds inside both
  `/explore` and `/results`, and the others stay reachable for anything
  that still deep-links them).
- `src/app/reservations/page.tsx` — the reservation/trip tracker (Phase 1).
