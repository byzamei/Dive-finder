# Data model

Full schema: `supabase/migrations/0001_extensions.sql` through
`0009_data_health.sql`. This doc is a map, not a duplicate — read the SQL
for exact columns/constraints.

## Entity groups

| Group | Tables |
|---|---|
| Geography | `countries`, `regions`, `destinations`, `dive_sites` |
| Wildlife | `marine_species`, `destination_species`, `site_species`, `species_seasonality` |
| Environment | `environmental_seasonality` |
| Certification | `certification_agencies`, `certifications`, `user_certifications` |
| Users | `profiles`, `diver_profiles` |
| Commerce | `dive_centers`, `liveaboards`, `prices` |
| Community | `reviews`, `species_sightings`, `favorites`, `searches` |
| Data governance | `data_sources`, `data_claims`, `data_refresh_jobs`, `admin_review_queue`, `critical_fields_registry` |

## Why `data_claims` is separate from the entity tables

Core tables (`destinations`, `dive_sites`, ...) hold the fields the UI reads
directly. `data_claims` is the **provenance ledger**: every claim about a
field carries `source_id`, `confidence`, `review_status`, `observed_at`,
`expires_at`, and — critically — a `superseded_by` pointer instead of being
deleted when contradicted. This lets the admin UI show "two sources
disagree about X" instead of one silently overwriting the other. See
`docs/data-governance.md`.

In V1, some fields are read directly from `data_claims` at query time
(e.g. `recommended_level`, `typical_current` for scoring — see
`searchService.buildScoringFacts`), while stable/structural fields
(`destinations.name`, `dive_sites.min_depth_m`, etc.) live as normal
columns that an admin edits directly. Either way, `getVerifiedClaims()`
surfaces the sourcing trail on destination/site detail pages.

## Certifications are never cross-agency equivalents

`certifications.level_rank` is an ordering **within one agency only**
(`certifications.agency_id`). The app never maps "PADI Advanced Open Water"
to "an equivalent SSI level" — a diver's certification stays tied to its
issuing agency. `DiverProfile.cave_experience_declared` is explicitly a
self-reported flag, never treated as authorization (see `lib/scoring/hardFilters.ts`).

## Geography

`destinations` and `dive_sites` carry `latitude`/`longitude` (always
present, portable) plus a `geom geography(Point,4326)` column kept in sync
by a trigger, for PostGIS-backed queries if/when needed (nearest-site,
bounding-box search). If your Postgres doesn't have PostGIS, drop the
`create extension postgis` line and the `geom` columns/indexes in
`0002_geo_reference.sql` — nothing else depends on them.

## Data Health views

`0009_data_health.sql` defines `critical_fields_registry` (which fields
count as "critical" per entity type), plus views:
`v_fresh_data_claims`, `v_expired_data_claims`,
`v_destination_critical_field_coverage`,
`v_dive_site_critical_field_coverage`, `v_data_health_summary`. The Admin
Data Health screen reads these directly — see `docs/data-governance.md §Data Health`.
