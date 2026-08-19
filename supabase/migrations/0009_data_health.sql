-- DiveFinder — 0009: Data Health measurement.
-- Defines which fields are "critical" per entity type, and views that
-- compute the metrics required by Admin > Data Health
-- (docs/data-governance.md §22).

create table if not exists critical_fields_registry (
  entity_type text not null,
  field_name text not null,
  primary key (entity_type, field_name)
);

insert into critical_fields_registry (entity_type, field_name) values
  ('destination', 'best_months'),
  ('destination', 'budget_indicative'),
  ('destination', 'recommended_level'),
  ('destination', 'water_temp_range'),
  ('dive_site', 'depth_range'),
  ('dive_site', 'visibility_range'),
  ('dive_site', 'current'),
  ('dive_site', 'recommended_level')
on conflict do nothing;

-- Non-demo, non-superseded claims that are still within their validity
-- window (never surfaced as "current" once expired).
create or replace view v_fresh_data_claims as
select *
from data_claims
where demo_data = false
  and superseded_by is null
  and (expires_at is null or expires_at > now());

create or replace view v_expired_data_claims as
select *
from data_claims
where demo_data = false
  and superseded_by is null
  and expires_at is not null
  and expires_at <= now();

create or replace view v_destination_critical_field_coverage as
select
  d.id as destination_id,
  d.name,
  count(distinct cfr.field_name) as critical_fields_total,
  count(distinct dc.field_name) filter (
    where dc.review_status = 'verified' and (dc.expires_at is null or dc.expires_at > now())
  ) as critical_fields_sourced
from destinations d
cross join critical_fields_registry cfr
left join data_claims dc
  on dc.entity_type = 'destination'
  and dc.entity_id = d.id
  and dc.field_name = cfr.field_name
  and dc.demo_data = false
  and dc.superseded_by is null
where cfr.entity_type = 'destination'
  and d.demo_data = false
group by d.id, d.name;

create or replace view v_dive_site_critical_field_coverage as
select
  s.id as site_id,
  s.name,
  count(distinct cfr.field_name) as critical_fields_total,
  count(distinct dc.field_name) filter (
    where dc.review_status = 'verified' and (dc.expires_at is null or dc.expires_at > now())
  ) as critical_fields_sourced
from dive_sites s
cross join critical_fields_registry cfr
left join data_claims dc
  on dc.entity_type = 'dive_site'
  and dc.entity_id = s.id
  and dc.field_name = cfr.field_name
  and dc.demo_data = false
  and dc.superseded_by is null
where cfr.entity_type = 'dive_site'
  and s.demo_data = false
group by s.id, s.name;

-- A destination/site is "ready" once at least half its registered critical
-- fields carry a verified, non-expired claim. Threshold is intentionally
-- conservative for V1 — tune in docs/data-governance.md if needed.
create or replace view v_data_health_summary as
select
  (
    select coalesce(round(100.0 * sum(critical_fields_sourced) / nullif(sum(critical_fields_total), 0)), 0)
    from (
      select * from v_destination_critical_field_coverage
      union all
      select site_id, name, critical_fields_total, critical_fields_sourced from v_dive_site_critical_field_coverage
    ) all_coverage
  ) as critical_fields_sourced_pct,
  (
    select coalesce(round(100.0 * count(*) filter (where expires_at is null or expires_at > now())
      / nullif(count(*), 0)), 0)
    from data_claims
    where demo_data = false and superseded_by is null
  ) as fresh_claims_pct,
  (
    select count(*) from v_destination_critical_field_coverage
    where critical_fields_total > 0 and critical_fields_sourced::float / critical_fields_total >= 0.5
  ) as destinations_ready_count,
  (
    select count(*) from v_dive_site_critical_field_coverage
    where critical_fields_total > 0 and critical_fields_sourced::float / critical_fields_total >= 0.5
  ) as dive_sites_ready_count,
  (
    select count(*) from marine_species s
    where exists (select 1 from destination_species ds where ds.species_id = s.id)
       or exists (select 1 from site_species ss where ss.species_id = s.id)
  ) as species_ready_count,
  (
    select count(*) from data_claims where review_status = 'disputed' and demo_data = false
  ) as disputed_claims_count,
  (
    select count(*) from data_claims
    where demo_data = false and superseded_by is null
      and field_name in ('price', 'amount_min', 'amount_max')
      and expires_at is not null and expires_at <= now()
  ) as expired_price_claims_count,
  (
    select count(*) from destinations where demo_data = false and status = 'published'
  ) as published_destinations_count,
  (
    select count(*) from data_sources where source_type <> 'demo'
  ) as active_sources_count,
  (
    select count(*) from admin_review_queue where status = 'open'
  ) as open_review_queue_count;
