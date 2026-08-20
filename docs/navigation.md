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
   effect (skipping steps already gets you to the same place). Someone who
   already knows their destination just uses Explore directly.
2. **Explore** (`/explore`) — a Google-Flights-style split view: a filter
   panel + scrollable list on the left, a persistent map on the right, both
   driven by the same filter state at once (picking a month or a species
   updates the list AND the map together — no separate "apply" step). The
   filters are literally `SearchCriteria` — the same type and the same
   `searchDestinations()` call the Search wizard uses — just presented flat
   and always-visible instead of stepped, so there's one scoring/filtering
   engine, not two that could quietly drift apart. This replaced an earlier
   version with three big "Destinations / Animals / Season" tiles at the
   top; the tiles mirrored the same three angles but required picking one
   before you could see anything, where filters let all of them apply
   together. Map pins show a price label (`from €45`) when the destination
   has at least one real, currently-listed operator price — computed as
   the minimum observed price across that destination's own dive centers
   and liveaboards (`getCheapestPricePerDestination` in
   `operatorService.ts`), never a fabricated or estimated figure; a
   destination with no priced operator yet just shows an unlabeled pin.
   Dive sites are deliberately not folded into this same filter/list: a
   destination can contain many sites, so conflating them as equal
   browsing units would hide that hierarchy. Instead there's a plain link
   at the bottom ("Browse individual dive sites →" `/sites`), and every
   destination card in the list shows its own site count. Each card also
   has a "Compare" checkbox (comparing used to be its own nav item —
   removed in favor of selecting inline, same pattern as the Results page).
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
- `src/app/explore/page.tsx` — the catalog: filter panel + destination
  list/map split view.
- `src/app/gear/page.tsx` — the Gear hub.
- `src/app/destinations/page.tsx`, `src/app/sites/page.tsx`, `src/app/map/page.tsx`
  — still exist as standalone routes (nothing links here as a primary
  nav item anymore, but they're not dead: `/map` embeds inside `/explore`,
  and the others stay reachable for anything that still deep-links them).
- `src/app/reservations/page.tsx` — the reservation/trip tracker (Phase 1).
