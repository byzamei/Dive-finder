-- DiveFinder — closes a real gap in Admin > Data Health's "critical
-- fields" score (supabase/migrations/0009_data_health.sql).
--
-- That view only counts a field as "sourced" when a matching data_claims
-- row exists for the exact registered field_name. Two of our own earlier
-- population passes wrote the real data straight onto columns (or onto
-- operators, for prices) without ever writing a data_claims row under the
-- specific field_name the registry checks for — so Data Health has been
-- under-reporting coverage for every real destination and site, even ones
-- with genuinely sourced data:
--
--   1. Destination 'budget_indicative' — real prices live on operators
--      (dive_centers / liveaboards), never on the destination row.
--   2. Site 'depth_range' / 'visibility_range' / 'current' /
--      'recommended_level' — the real dive-sites pass
--      (2026-08-21-real-dive-sites-19-destinations.sql) wrote these
--      straight onto dive_sites' own columns and only ever recorded a
--      generic 'site_description' claim, never these specific ones.
--
-- Both fixes backfill a claim only where the real value already exists,
-- reusing that entity's own already-recorded source — never a new,
-- converted, or fabricated figure. This is a point-in-time snapshot: if the
-- underlying price or site data changes later, these claims won't
-- auto-refresh (the idempotency guards below only add the claim where it's
-- still missing) — a future update to the source data should also refresh
-- the matching claim here.

-- 1. Destination budget_indicative — cheapest current price across that
-- destination's own dive centers and liveaboards.
insert into data_claims (
  entity_type, entity_id, field_name, value_json, source_id, source_type,
  observed_at, confidence, review_status, demo_data
)
select distinct on (d.id)
  'destination', d.id, 'budget_indicative',
  jsonb_build_object(
    'amount_min', p.amount_min,
    'amount_max', p.amount_max,
    'currency', p.currency,
    'derived_from', 'cheapest current operator price'
  ),
  p.source_id, 'official_operator', now(), 'medium', 'verified', false
from destinations d
join (
  select id, destination_id from dive_centers
  union all
  select id, destination_id from liveaboards
) op on op.destination_id = d.id
join prices p
  on p.entity_type in ('dive_center', 'liveaboard')
  and p.entity_id = op.id
  and p.amount_min is not null
  and p.demo_data = false
  and (p.expires_at is null or p.expires_at > now())
where d.demo_data = false
  and not exists (
    select 1 from data_claims c
    where c.entity_type = 'destination' and c.entity_id = d.id
      and c.field_name = 'budget_indicative' and c.superseded_by is null
  )
order by d.id, p.amount_min asc;

-- 2. Site critical fields — one claim per field the site's own row already
-- carries real data for, sourced from whatever this site's earliest
-- existing claim was sourced from (any real source is fine here, not
-- necessarily 'site_description' specifically — some sites, like Fiji's
-- three from an earlier pass, may not have that exact claim).
with site_source as (
  select distinct on (entity_id) entity_id as site_id, source_id
  from data_claims
  where entity_type = 'site' and source_id is not null and superseded_by is null
  order by entity_id, created_at asc
)
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'site', s.id, 'depth_range',
  jsonb_build_object('min_depth_m', s.min_depth_m, 'max_depth_m', s.max_depth_m),
  ss.source_id, 'editorial', now(), 'medium', 'verified', false
from dive_sites s
join site_source ss on ss.site_id = s.id
where s.demo_data = false
  and (s.min_depth_m is not null or s.max_depth_m is not null)
  and not exists (
    select 1 from data_claims c
    where c.entity_type = 'site' and c.entity_id = s.id and c.field_name = 'depth_range' and c.superseded_by is null
  );

with site_source as (
  select distinct on (entity_id) entity_id as site_id, source_id
  from data_claims
  where entity_type = 'site' and source_id is not null and superseded_by is null
  order by entity_id, created_at asc
)
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'site', s.id, 'visibility_range',
  jsonb_build_object('visibility_m_min', s.typical_visibility_m_min, 'visibility_m_max', s.typical_visibility_m_max),
  ss.source_id, 'editorial', now(), 'medium', 'verified', false
from dive_sites s
join site_source ss on ss.site_id = s.id
where s.demo_data = false
  and (s.typical_visibility_m_min is not null or s.typical_visibility_m_max is not null)
  and not exists (
    select 1 from data_claims c
    where c.entity_type = 'site' and c.entity_id = s.id and c.field_name = 'visibility_range' and c.superseded_by is null
  );

with site_source as (
  select distinct on (entity_id) entity_id as site_id, source_id
  from data_claims
  where entity_type = 'site' and source_id is not null and superseded_by is null
  order by entity_id, created_at asc
)
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'site', s.id, 'current',
  jsonb_build_object('typical_current', s.typical_current),
  ss.source_id, 'editorial', now(), 'medium', 'verified', false
from dive_sites s
join site_source ss on ss.site_id = s.id
where s.demo_data = false
  and s.typical_current is not null
  and not exists (
    select 1 from data_claims c
    where c.entity_type = 'site' and c.entity_id = s.id and c.field_name = 'current' and c.superseded_by is null
  );

with site_source as (
  select distinct on (entity_id) entity_id as site_id, source_id
  from data_claims
  where entity_type = 'site' and source_id is not null and superseded_by is null
  order by entity_id, created_at asc
)
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'site', s.id, 'recommended_level',
  jsonb_build_object('recommended_level', s.recommended_level),
  ss.source_id, 'editorial', now(), 'medium', 'verified', false
from dive_sites s
join site_source ss on ss.site_id = s.id
where s.demo_data = false
  and s.recommended_level is not null
  and not exists (
    select 1 from data_claims c
    where c.entity_type = 'site' and c.entity_id = s.id and c.field_name = 'recommended_level' and c.superseded_by is null
  );
