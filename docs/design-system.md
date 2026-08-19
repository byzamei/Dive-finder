# Design system

## Direction

Abyssal / editorial / cartographic marine science. Premium travel, not a
turquoise-and-cartoon-fish cliché. Functional references (behavior only,
never visual copying): Airbnb for discovery cards, Google Maps for the map
screen, Booking for dense filters, Strava for the profile, Letterboxd for
the save/collect pattern.

## Tokens (`tailwind.config.ts`)

| Token | Use |
|---|---|
| `abyss-50…950` | Near-black navy → off-white neutral scale. Text, dark hero backgrounds, borders. |
| `ocean-50…900` | Primary action blue. |
| `seaglass-50…700` | Desaturated aqua — success/positive states, "Fresh" badge. |
| `coral-400…600` | Rare warm accent — primary CTA alternates, "Stale"/trade-off/danger tones. |
| `sand-50…200` | Warm off-white page backgrounds. |
| `font-display` | Serif system stack (`--font-display`) for headings — editorial feel without an external font fetch. |
| `font-body` | System sans stack for body copy. |

Fonts intentionally use system stacks rather than `next/font/google` so the
app builds without network access to a font CDN; swapping in a real
webfont pairing (e.g. a serif display + grotesk body) is a follow-up and
only touches `globals.css` + `tailwind.config.ts`.

## Components (`src/components/ui`, `src/components/badges`)

- `Button` / `ButtonLink` — 5 variants (primary/secondary/outline/ghost/coral), 3 sizes, `focus-ring` utility for visible keyboard focus.
- `Card` / `CardBody` — the base surface for results, admin lists, profile sections.
- `Skeleton` / `ResultCardSkeleton` — loading states (Results page).
- `EmptyState` — every list view has a designed empty state, never a blank screen.
- `ErrorBoundary` — wraps route content in `layout.tsx`.
- `Badge` + `FreshnessBadge` / `ConfidenceBadge` / `VerifiedAgoBadge` / `SuitabilityBadge` / `DemoDataBadge` — the data-trust vocabulary used everywhere a claim/value is shown. These are not decorative — see `docs/data-governance.md`.

## Layout

- Mobile-first. `BottomNav` (Discover / Map / Saved / Profile) on small
  screens, `TopNav` (adds Wildlife/Compare) on `md:` and up. Both hide on
  `/admin/**`, which uses its own sidebar (`admin/layout.tsx`).
- `--safe-area-top/bottom` (from `env(safe-area-inset-*)`) applied to the
  bottom nav and root padding for notch/home-indicator devices.
- Touch targets: nav items and primary buttons are ≥44px tall.

## Accessibility

- `.focus-ring` utility (visible focus ring, `focus-visible` only) applied
  to every interactive primitive.
- Semantic landmarks (`<nav aria-label>`, `<header>`, `<main>`) in layout
  and nav components.
- Color is never the only signal — badges pair color with a text label
  (e.g. "Stale", not just amber).
