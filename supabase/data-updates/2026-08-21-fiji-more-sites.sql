-- DiveFinder — two more real, well-documented Beqa Lagoon (Fiji) dive
-- sites, so the Search page's "explore a country" inspiration section has
-- more than one real site to show for its featured destination (today
-- that's Fiji — see 2026-08-21-bull-shark-fiji.sql for the first one,
-- Shark Reef Marine Reserve). Sourced from multiple independent dive-
-- operator/travel-guide descriptions of Beqa Lagoon (search-indexed
-- excerpts, not a live page fetch — see docs/operators.md), confidence
-- 'medium'. Depth/current figures are left null where no source stated a
-- specific number — never estimated.
--
-- Idempotent: safe to re-run.

with dest as (
  select id from destinations where slug = 'fiji'
),
src as (
  insert into data_sources (name, source_type, reliability, notes)
  values ('Beqa Lagoon dive-site guides (multi-source cross-check)', 'editorial', 'medium',
    'Cross-referenced multiple independent Beqa Lagoon dive-site descriptions (operator and travel-guide sites); no single live page fetch, per docs/operators.md.')
  on conflict (name) do update set notes = excluded.notes
  returning id
),
sites as (
  insert into dive_sites (slug, destination_id, name, latitude, longitude, access_type, site_type, typical_current, status, demo_data)
  select v.slug, dest.id, v.name, -18.24, 178.09, 'boat', v.site_type::text[], v.typical_current, 'published', false
  from dest, (values
    ('caesars-rocks-fiji', 'Caesar''s Rocks', array['reef', 'pelagic'], null::text),
    ('side-streets-fiji', 'Side Streets', array['reef', 'drift'], 'mild')
  ) as v(slug, name, site_type, typical_current)
  on conflict (slug) do update set typical_current = excluded.typical_current
  returning id, slug, name
)
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'site', sites.id, 'site_description',
  jsonb_build_object('name', sites.name, 'location', 'Beqa Lagoon, Fiji'),
  src.id, 'editorial', now(), 'medium', 'verified', false
from sites
cross join src
where not exists (
  select 1 from data_claims c where c.entity_type = 'site' and c.entity_id = sites.id and c.field_name = 'site_description'
);
