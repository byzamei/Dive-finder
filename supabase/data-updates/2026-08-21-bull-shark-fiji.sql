-- DiveFinder — real species↔site/destination association, for testing the
-- "Where to see it" feature on the species page (it was empty for every
-- species so far — wildlife-destination data was never populated, only
-- operators and destination coordinates).
--
-- Fiji's Shark Reef Marine Reserve (Beqa Passage, off Pacific Harbour) is
-- one of the most extensively documented bull shark dive sites in the
-- world — a national marine park established in 2004 specifically for
-- shark diving, with the largest known bull shark aggregation anywhere.
-- Confidence is 'medium', consistent with the rest of this data-population
-- pass: sourced from Tourism Fiji's own site and the dive operator's own
-- site via search-indexed excerpts, not a live page fetch (this research
-- environment's page-fetch tool is blocked, per docs/operators.md).
--
-- Also creates the site itself (dive_sites had ZERO real, non-demo rows
-- until now — every real destination showed "0 dive sites" in Explore).
--
-- Idempotent: safe to re-run.

with dest as (
  select id from destinations where slug = 'fiji'
),
species as (
  select id from marine_species where slug = 'bull-shark'
),
src as (
  insert into data_sources (name, source_type, url, reliability, notes)
  values ('Tourism Fiji — Shark Reef Marine Reserve', 'tourism_board', 'https://www.fiji.travel/places-to-go/pacific-harbour/locations/diving-with-sharks-in-fiji-s-first-national-marine', 'high',
    'Fiji''s official tourism board page for Shark Reef Marine Reserve. Verified via indexed search snippet, not a direct live-page fetch — see docs/operators.md.')
  on conflict (name) do update set url = excluded.url, updated_at = now()
  returning id
),
site as (
  insert into dive_sites (slug, destination_id, name, latitude, longitude, access_type, site_type, min_depth_m, max_depth_m, status, demo_data)
  select 'shark-reef-marine-reserve-fiji', dest.id, 'Shark Reef Marine Reserve (Beqa Passage)', -18.24, 178.09, 'boat', array['reef', 'pelagic'], 10, 30, 'published', false
  from dest
  on conflict (slug) do update set latitude = excluded.latitude, longitude = excluded.longitude
  returning id, destination_id
),
ds as (
  insert into destination_species (destination_id, species_id, demo_data)
  select site.destination_id, species.id, false from site, species
  on conflict (destination_id, species_id) do nothing
  returning id
),
ss as (
  insert into site_species (site_id, species_id, demo_data)
  select site.id, species.id, false from site, species
  on conflict (site_id, species_id) do nothing
  returning id
)
-- ds/ss are joined (not just cross-referenced) so they're guaranteed to
-- execute even though nothing else selects their columns — an
-- unreferenced CTE in Postgres never runs at all, and a plain `from site,
-- src` here would silently skip the destination_species/site_species
-- inserts, which are the actual point of this script.
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'site', site.id, 'species_presence',
  jsonb_build_object('species', 'Bull shark', 'notes', 'Largest known bull shark aggregation in the world; controlled dive protocol run by Beqa Adventure Divers since 2004.'),
  src.id, 'tourism_board', now(), 'medium', 'verified', false
from site
cross join src
left join ds on true
left join ss on true
where not exists (
  select 1 from data_claims c where c.entity_type = 'site' and c.entity_id = site.id and c.field_name = 'species_presence'
);
