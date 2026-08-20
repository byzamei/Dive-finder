# Navigation structure

Restructured post-V1 at the product owner's request: the original nav grew
one item at a time as features shipped (Discover, Wildlife, Map, Compare,
Mask Finder, Sites, Logbook, Saved…) until it no longer fit comfortably and
had no real organizing principle. The rebuild groups by **journey stage**
instead:

## The five primary tabs

1. **Discover** (`/discover`) — the search entry point. Its first screen is
   a mode selector, not a form: "help me find a destination" (the original
   6-step scored wizard), "I'm chasing an animal" (same wizard, starting at
   the Wildlife step), or "I already know my destination" (a name search
   that jumps straight to `/destinations/[slug]`, bypassing the wizard
   entirely). The three homepage quick-cards (`?entry=dates|animal|destination`)
   pre-select a mode and skip the selector; arriving at `/discover` directly
   (e.g. from the nav) shows it. Rationale: the old wizard forced everyone
   through the same dates-first linear form even when they already knew
   their destination or just wanted to search by animal — this lets people
   choose how they want to search instead of assuming one path fits all.
2. **Explore** (`/explore`) — a hub page linking to every way to browse the
   catalog: Destinations, Sites, Map, Wildlife, Compare, Mask Finder. These
   were all separate top-level nav items before; they're the same content
   underneath, just different lenses on it, so they're grouped rather than
   competing for nav space.
3. **Reservations** (`/reservations`) — a personal trip/booking tracker
   (upcoming/past/cancelled, linked to real operators). Currently a
   placeholder — the real version is a separate build. Deliberately
   distinct from **Logbook**: a reservation is a booking, a logbook entry
   is one dive; a reservation can contain many dives.
4. **Favorites** (`/saved`) — favorites/named lists. Route stayed `/saved`
   (established, widely linked) even though the label became "Favorites";
   `/reservations` got the matching route rename since it was brand new.
5. **Account** (`/profile`) — identity, badges, the diver profile form, and
   the **Logbook** (linked from a card on this page, not a top-level tab —
   it's inherently account-scoped, like Reservations and Favorites).

## Soft-gating, not hiding

Personal tabs (Reservations, Favorites, Account) stay visible and
reachable to signed-out visitors instead of being hidden from the nav or
hard-redirected to `/login`. Tapping in shows what the feature is and a
sign-in prompt, rather than disappearing entirely or bouncing you away
with no context — same reasoning as the existing soft-gates on Mask
Finder's "save to profile" and the Wildlife life-list toggle. The nav
itself becomes part of the pitch for creating an account, instead of
hiding that pitch. `/reservations` follows this pattern; `/saved` and
`/profile` still hard-redirect via `requireUser()` from before this
restructure — bringing them in line is a reasonable follow-up, not done
here to keep this change scoped to navigation and the two new hub pages.

## Files

- `src/components/nav/TopNav.tsx` — desktop, the 4 primary links + Account.
- `src/components/nav/BottomNav.tsx` — mobile, all 5 primary tabs.
- `src/components/nav/MobileHeader.tsx` — mobile hamburger menu, now scoped
  to just the Explore sub-sections (the 5 primary tabs are always visible
  in BottomNav, so they're not duplicated here).
- `src/app/explore/page.tsx` — the new hub page.
- `src/app/destinations/page.tsx` — new: a real "browse all destinations"
  index, which didn't exist before (destinations were only reachable via
  search results or a species/site's back-link).
- `src/app/reservations/page.tsx` — placeholder for the future
  reservation/trip tracker.
