# Architecture

## Stack

- **Next.js 14 (App Router) + TypeScript + React 18** — server components for
  SEO-relevant pages (destination/site/species detail), client components
  for interactive flows (Discover wizard, Results, Map, Compare, Admin
  forms use server actions).
- **Tailwind CSS** — utility-first styling on top of the design tokens in
  `tailwind.config.ts` (see `docs/design-system.md`).
- **Supabase** — Postgres + PostGIS, Auth (magic link + optional Google
  OAuth), and Row Level Security as the actual authorization boundary
  (not just app-layer checks).
- **Mapbox GL JS** — loaded dynamically, client-side only, behind the
  `mapService` abstraction (`src/lib/services/mapService.ts` +
  `src/components/map/`). Falls back to a list/grid view with a visible
  notice when `NEXT_PUBLIC_MAPBOX_TOKEN` is unset.
- **Vitest** — unit tests for the scoring/data-governance logic; a small
  integration suite for RLS/admin enforcement that only runs against a
  real (disposable) Supabase test project.

## Layers

```
app/*                   Routes (pages, layouts, server actions)
components/*             Presentational + a few stateful client components
lib/services/*           Data-access layer (Supabase queries only — no UI)
lib/scoring/*             Pure, DB-independent scoring engine
lib/types/domain.ts       Shared TypeScript types mirroring the DB schema
lib/supabase/*             Client/server/admin Supabase client factories
lib/auth/session.ts        Server-side session/role helpers
supabase/migrations/*      SQL schema, RLS, Data Health views
supabase/seed/*             Seed script (idempotent, upsert-based)
```

The scoring engine (`lib/scoring/`) intentionally has **zero** dependency on
Supabase or Next.js — it operates on plain `DestinationScoringFacts` /
`SearchCriteria` objects, which is what makes it possible to unit test the
core "why did this destination rank here" logic (tests/unit/scoring.test.ts)
without a database. `lib/services/searchService.ts` is the only place that
turns Supabase rows into `DestinationScoringFacts`.

## Data flow for a search

1. `DiscoverWizard` collects `SearchCriteria` client-side, encodes it into
   the `/results?c=<base64url json>` URL (see `lib/utils/searchParams.ts`).
2. `/results` calls `recommendationService.searchDestinations()`, which:
   - fetches candidate destinations (`searchService.listCandidateDestinations`)
   - builds `DestinationScoringFacts` per destination from `data_claims`,
     `species_seasonality`, `environmental_seasonality`, `prices`, `reviews`
   - runs `scoreAllDestinations()` (hard filters, then weighted scoring)
   - best-effort logs the search to `searches` for analytics
3. Results render with match score, data completeness, reasons, trade-offs,
   unknowns, and any safety warnings — see `docs/scoring.md`.

## Auth & authorization

- Anonymous users can search, browse, and view every public page.
- Signing in (magic link, or Google OAuth if configured) is required only
  for Favorites and the Diver Profile.
- `profiles.role` distinguishes `user` from `admin`. `requireAdmin()`
  (`lib/auth/session.ts`) redirects non-admins away from `/admin/**` as a
  UX nicety — the actual enforcement is Postgres RLS
  (`supabase/migrations/0008_rls_policies.sql`), so even a bypassed UI
  check can't leak or corrupt data.
- Promote a user to admin with `npm run create-admin -- you@example.com`
  (requires `SUPABASE_SERVICE_ROLE_KEY`).

## Deployment

Designed for Vercel: `next build` + `next start` (or Vercel's managed
build). No server other than Next.js route handlers/server actions and
Supabase is required. See README.md for the full deploy checklist.
