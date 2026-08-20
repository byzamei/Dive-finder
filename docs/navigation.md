# Navigation structure

Restructured post-V1 at the product owner's request: the original nav grew
one item at a time as features shipped (Discover, Wildlife, Map, Compare,
Mask Finder, Sites, Logbook, Saved…) until it no longer fit comfortably and
had no real organizing principle. The rebuild groups by **journey stage**
instead:

## The five primary tabs

1. **Discover** (`/discover`) — the search wizard. Front door.
2. **Explore** (`/explore`) — a hub page linking to every way to browse the
   catalog: Destinations, Sites, Map, Wildlife, Compare, Mask Finder. These
   were all separate top-level nav items before; they're the same content
   underneath, just different lenses on it, so they're grouped rather than
   competing for nav space.
3. **Trips** (`/trips`) — a personal trip tracker (upcoming/past/cancelled,
   linked to real operators). Currently a placeholder — the real version is
   a separate build (see the "réservations" discussion in product history).
   Deliberately distinct from **Logbook**: a trip is a booking, a logbook
   entry is one dive; a trip can contain many dives.
4. **Saved** (`/saved`) — favorites/named lists.
5. **Account** (`/profile`) — identity, badges, the diver profile form, and
   the **Logbook** (linked from a card on this page, not a top-level tab —
   it's inherently account-scoped, like Trips and Saved).

## Soft-gating, not hiding

Personal tabs (Trips, Saved, Account) stay visible and reachable to
signed-out visitors instead of being hidden from the nav or hard-redirected
to `/login`. Tapping in shows what the feature is and a sign-in prompt,
rather than disappearing entirely or bouncing you away with no context —
same reasoning as the existing soft-gates on Mask Finder's "save to
profile" and the Wildlife life-list toggle. The nav itself becomes part of
the pitch for creating an account, instead of hiding that pitch. `/trips`
follows this pattern; `/saved` and `/profile` still hard-redirect via
`requireUser()` from before this restructure — bringing them in line is a
reasonable follow-up, not done here to keep this change scoped to
navigation and the two new hub pages.

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
- `src/app/trips/page.tsx` — placeholder for the future trip tracker.
