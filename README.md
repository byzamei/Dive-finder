# DiveFinder

An independent, explainable dive destination recommendation engine — not a
booking marketplace. Tell it your dates, budget, level, accepted conditions
and the wildlife you want to see; it explains exactly why each destination
ranks where it does, and is honest about what it doesn't know yet.

See `docs/architecture.md`, `docs/data-model.md`, `docs/data-governance.md`,
`docs/scoring.md`, and `docs/design-system.md` for the deeper detail behind
each part of this README.

## 1. Prerequisites

- Node.js 18.18+ (Node 20/22 also fine)
- A free [Supabase](https://supabase.com) project (Postgres + Auth + PostGIS)
- npm (bundled with Node)

## 2. Install

```bash
npm install
```

## 3. Environment variables

```bash
cp .env.example .env.local
```

Fill in:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from your
  Supabase project's Settings → API.
- `SUPABASE_SERVICE_ROLE_KEY` — same page, **server-only**, used by the seed
  script and `create-admin` script. Never expose this in client code.
- `NEXT_PUBLIC_MAPBOX_TOKEN` — optional (see §11). Leave blank to use the
  built-in list/grid fallback on `/map`.
- `NEXT_PUBLIC_SITE_URL` — `http://localhost:3000` for local dev.

## 4. Create the Supabase project

1. Create a new project at [supabase.com](https://supabase.com/dashboard).
2. Install the Supabase CLI if you don't have it: `npm i -g supabase`.
3. Link it: `supabase link --project-ref <your-project-ref>` (from the
   project's Settings → General).

## 5. Apply migrations

```bash
supabase db push
```

This runs every file in `supabase/migrations/` in order — schema, RLS
policies, and the Data Health views. Migrations are idempotent
(`create table if not exists`, `create or replace`) so re-running is safe.

If you'd rather not install the Supabase CLI (or can't reach your project
from the CLI's network), paste `supabase/all_migrations.sql` — every
migration file combined, in order — into **SQL Editor** in the Supabase
dashboard and click **Run** once. It's regenerated from
`supabase/migrations/0001..0011` and is safe to re-run (every statement is
`create ... if not exists` / `create or replace`).

## 6. Seed the database

```bash
npm run seed
```

Populates: the 20 real destinations from the product brief (name + slug +
country **only** — every dive-condition field is intentionally left
unset so the app shows an honest "no verified data yet" state), 12 marine
species, certification agencies/certifications, and 3 isolated
`Demo Island A/B/C` destinations with fully fabricated, clearly
`demo_data = true` content so you can see every UI state (populated
seasonality, pricing, an expired claim, etc.) without it ever being
mistaken for a real observation. Safe to re-run — every insert upserts on
its natural key.

**No terminal / can't run npm?** Paste `supabase/seed/seed.sql` into the
same SQL Editor and run it after the migrations — it's a plain-SQL mirror
of the exact same seed data, also safe to re-run.

**Mask Finder catalog:** if your project already existed before the Gear
feature was added, also run `supabase/migrations/0010_gear.sql` (already
included in a regenerated `supabase/all_migrations.sql`) and
`supabase/seed/gear_seed.sql` to add the `masks` table and its starter
catalog — see `docs/gear-mask-finder.md`.

**Richer profile (avatar, saved lists, species life list):** if your
project already existed before this was added, also run
`supabase/migrations/0011_profile_v2.sql` (already included in a
regenerated `supabase/all_migrations.sql`). It adds `profiles.bio` /
`profiles.home_base`, a public `avatars` Storage bucket (created via SQL —
no manual dashboard steps needed), the `saved_lists` table, and the
`user_species_seen` table (a personal "species I've seen" checklist,
distinct from the sourced/editorial `species_sightings` table).

**Logbook:** if your project already existed before this was added, also
run `supabase/migrations/0012_dive_log.sql` (already included in a
regenerated `supabase/all_migrations.sql`) to add the `dive_log_entries`
table — see `docs/dive-log.md`.

**Mask Finder fit concerns:** if your project already existed before this
was added, also run `supabase/migrations/0013_mask_concerns.sql` (already
included in a regenerated `supabase/all_migrations.sql`) to add
`diver_profiles.mask_fit_concerns` — see `docs/gear-mask-finder.md`.

## 7. Create an admin user

1. Run the app (`npm run dev`) and sign up once via `/login` (magic link —
   check your inbox, or the Supabase dashboard's Auth logs in local dev).
2. Promote that account:

```bash
npm run create-admin -- you@example.com
```

3. Sign out and back in. `/admin` is now reachable.

## 8. Run locally

```bash
npm run dev
```

Open http://localhost:3000. Try the golden path: **Find my dive
destination** → pick a month → set a budget → set your level → pick a
couple of animals → **See results**. Because the seeded real destinations
intentionally carry no dive-condition data yet, you'll see honest
"unknown" states everywhere — flip to the 3 `Demo Island` destinations (via
`/destinations/demo-island-a`, or by adding claims yourself in `/admin`) to
see the fully-populated experience.

## 9. Run tests

```bash
npm run typecheck
npm run lint
npm test
```

`npm test` runs the Vitest suite (`tests/unit/*`): the scoring engine
(hard filters, weighted dimensions, renormalization, data completeness) and
data-governance rules (freshness, conflict detection) — see
`docs/scoring.md`/`docs/data-governance.md` for what each test proves.

`tests/integration/rls-and-admin.test.ts` verifies Row Level Security and
admin-route protection against a **real, disposable** Supabase project —
it's automatically skipped unless `TEST_SUPABASE_URL` /
`TEST_SUPABASE_ANON_KEY` / `TEST_SUPABASE_SERVICE_ROLE_KEY` are set (never
point these at production data).

## 10. Deploy to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add the same environment variables from `.env.local` (§3) in Vercel's
   Project Settings → Environment Variables. **Do not** add
   `SUPABASE_SERVICE_ROLE_KEY` unless a server-only feature needs it in
   production (the seed/create-admin scripts are meant to be run locally
   against your project, not deployed).
4. Deploy. Build command `next build`, output is Next.js's default.

## 11. Map provider configuration

The map (`/map`) uses Mapbox GL JS behind a provider abstraction
(`src/lib/services/mapService.ts`, `src/components/map/`). Get a free
public token at [mapbox.com](https://account.mapbox.com/access-tokens/),
set `NEXT_PUBLIC_MAPBOX_TOKEN`, redeploy. Without a token, `/map` renders a
clearly-labeled list/grid fallback instead of an error — this is the
required "map works or has a clear fallback" behavior, not a bug.

Only destinations/sites with **verified** coordinates get a pin — nothing
is plotted at a guessed location.

## 12. Data Health

`/admin/data-health` (admin-only) reports: % of critical fields sourced,
% fresh claims, destinations/sites/species "ready", disputed claims,
expired price claims, plus tables of incomplete destinations/sites and
outstanding expired claims. Backed by SQL views in
`supabase/migrations/0009_data_health.sql` — see `docs/data-governance.md`.

---

## Troubleshooting

- **A page 500s / 404s locally right after cloning:** almost always means
  `.env.local` isn't filled in yet (§3) — every page that reads from
  Supabase (destination/site/wildlife detail, saved, profile, admin) needs
  a real project. `/`, `/discover`, `/login` work with no Supabase config
  since they don't fetch server-side on first render.
- **`npm run seed` fails with a connection error:** double-check
  `SUPABASE_SERVICE_ROLE_KEY` is set and migrations (§5) have been applied
  first — the seed script inserts into tables that must already exist.
- **Map shows a list instead of pins:** expected without
  `NEXT_PUBLIC_MAPBOX_TOKEN` — see §11.

## What's in V1 vs. deliberately out of scope

**In V1:** destinations, dive sites, marine species, seasonality (qualitative,
source-backed), diver profile + safety hard filters, explainable scoring
with a separate data-completeness score, results/compare/map/favorites,
full data-governance model (sources, claims, conflicts, TTL, review queue),
admin back-office, Data Health dashboard, PWA installability.

**Added post-V1 (by request):** Mask Finder — an on-device (privacy-first,
nothing uploaded) camera face-scan that suggests dive mask shapes suited
to your face, using the same qualitative/sourced-data approach as the
rest of the app. See `docs/gear-mask-finder.md`.

**Added post-V1 (by request):** a richer diver profile — editable avatar
(Supabase Storage), bio/home base, a deterministic badge engine
(`src/lib/profile/badges.ts`, same "explicit rule, no hidden threshold"
philosophy as the scoring engine), named saved lists instead of one flat
favorites pile, and a personal marine-species "life list" with a seen/all
filter on the Wildlife pages.

**Added post-V1 (by request):** diver reviews — the `reviews` table was
modeled in V1 but its submission UI stayed off behind a feature flag until
moderation tooling existed; both are now built (`src/components/reviews/*`,
`/admin/reviews`) and the flag is on. See `docs/reviews.md`.

**Added post-V1 (by request):** a dedicated `/sites` directory (browse
every published dive site directly, filtered by destination or access
type — previously only reachable through a destination page).

**Added post-V1 (by request):** a personal logbook (`/logbook`) — date,
site (catalog or free text), depth, duration, conditions, buddy, gas,
species observed (which also feed the species life list), a personal
rating, and notes. Private, owner-only RLS, never treated as verified
data about a site. See `docs/dive-log.md`.

**Deliberately out of scope:** booking/payments, a full marketplace,
social features/messaging, a complete dive log/carnet, live flight
pricing, real-time liveaboard/dive-center availability (needs real
operator data or booking-platform integrations — not yet sourced, see
`docs/data-governance.md`).

## Honesty about seed data

The 20 real destinations ship with **name and country only** — every
dive-specific field (depth, temperature, visibility, current, price,
season, wildlife likelihood, recommended level) is `NULL` until an admin
adds a sourced `DataClaim` via `/admin/claims`. This is intentional (see
`docs/data-governance.md`): a fresh clone of this repo must never present
invented data as real. The 3 `Demo Island` destinations are the only ones
with fabricated content, and are tagged `demo_data = true` end-to-end so
they can never be mistaken for real data in search results, Data Health
metrics, or the UI.

## Project layout

See `docs/architecture.md` for the full breakdown of `app/`, `components/`,
`lib/services/`, `lib/scoring/`, and `supabase/`.
