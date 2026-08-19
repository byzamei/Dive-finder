# Data governance

This is a product constraint, not a nice-to-have: **DiveFinder never invents
real-world diving data.** Depth, temperature, visibility, current, required
certification, season, wildlife-sighting likelihood, price, availability,
boat duration, taxes, operator/liveaboard details, recommended level, and
recent observations must all trace back to a `data_claims` row with a
`source_id`, or the field renders as unknown.

## The provenance model

`data_sources` → `data_claims` → (optionally) `admin_review_queue`.

A `DataClaim` (see `src/lib/types/domain.ts`) carries: `entity_type`,
`entity_id`, `field_name`, `value_json`, `unit`, `source_id`/`source_type`,
`observed_at`, `verified_at`, `valid_from`/`valid_to`, `expires_at`,
`confidence` (high/medium/low), `review_status`
(pending/verified/disputed/rejected), `reviewer_notes`, and `superseded_by`.

**Old claims are never deleted when contradicted.** `addClaim()`
(`src/lib/services/dataClaimService.ts`) checks whether a new claim's value
differs from an existing *verified* claim for the same (entity, field) —
`claimsConflict()` in `src/lib/utils/dataGovernance.ts`. If so, it inserts
the new claim as `pending` and pushes an `admin_review_queue` row with
`reason: 'disputed'` instead of overwriting anything. An admin resolves the
conflict explicitly via `supersedeClaim()`, which sets the old claim's
`superseded_by` to point at the winning one — full history stays queryable.

## Freshness / TTL

`isFresh()` / `isExpired()` (`src/lib/utils/freshness.ts`) is the single
implementation of "is this claim still current": `expires_at` absent means
"no TTL, treat as an estimate" (shown as the neutral "Estimated" badge);
`expires_at` in the past means the UI must never render the value as
current (`FreshnessBadge` shows "Stale"). Every price/claim query that
feeds scoring or a detail page filters `expires_at is null or expires_at >
now()` — see `searchService.buildScoringFacts` and `budgetService.getIndicativePrices`.

`data_refresh_jobs.ttl_category` documents the intended refresh cadence per
data type (tune the actual scheduling — a cron/Edge Function — outside V1's
scope):

| Category | Volatility | Example fields |
|---|---|---|
| `prices` | High | package/day-boat/liveaboard rates |
| `operator_status` | High | dive center/liveaboard operating status |
| `taxes_rules` | Medium | marine park fees, entry requirements |
| `seasonal_editorial` | Annual | "best months" narrative |
| `climate_normals` | Annual | water temp / visibility normals |
| `site_stable` | Very low | site coordinates, depth range |
| `recent_sighting` | Event-dated | a specific `species_sightings` row |

## Never merge a sighting into seasonality

`species_sightings` (dated, individual reports) and `species_seasonality`
(qualitative monthly suitability, source-backed) are separate tables on
purpose. A single recent sighting never silently updates the seasonality
calendar — that requires an explicit admin action backed by its own claim.

## Qualitative, not fabricated-numeric, wildlife suitability

`species_seasonality.suitability` is one of `excellent / good / possible /
low / unknown` — never a percentage. `scoreWildlifeMatch()`
(`src/lib/scoring/dimensions.ts`) maps these to an internal 0–1 weight for
ranking only; the UI (`SuitabilityBadge`) always renders the qualitative
label, never a "92% chance" figure. See `docs/scoring.md`.

## Demo data isolation

Three destinations ("Demo Island A/B/C") carry `demo_data = true`
end-to-end — the destination row, its dive site, prices, claims, and
seasonality. Every Data Health view and the default search/candidate query
(`listCandidateDestinations`) filters `demo_data = false` unless a caller
explicitly opts in. `DemoDataBadge` renders wherever demo content could
otherwise be mistaken for real.

## Data Health

Admin > Data Health (`/admin/data-health`) reads `v_data_health_summary`
and the coverage views (`supabase/migrations/0009_data_health.sql`) to
report: `critical_fields_sourced_pct`, `fresh_claims_pct`,
`destinations_ready_count`, `dive_sites_ready_count`,
`species_ready_count`, `disputed_claims_count`,
`expired_price_claims_count`, plus incomplete-destination/site tables and
the outstanding expired-claims list. "Ready" = at least 50% of a
destination/site's registered critical fields (`critical_fields_registry`)
have a verified, non-expired claim — deliberately conservative for V1.
