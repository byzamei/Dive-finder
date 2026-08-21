-- DiveFinder — continent classification for the 15 real countries.
-- Generated 2026-08-21. `countries.continent` has existed in the schema
-- since 0002_geo_reference.sql but was never populated or read anywhere —
-- Explore's destination list was a flat, unsorted grid of 20 names. This
-- adds a browse hierarchy (Continent → Country → Destination) modeled on
-- how LiveAboard.com's own destination directory groups countries.
--
-- Grouping used (Europe and Africa & Middle East kept separate, not
-- merged into "EMEA", per product direction): Asia, Europe,
-- Africa & Middle East, Americas, Pacific. This is a standard travel-
-- industry continent grouping, not a researched claim — confidence is
-- 'medium' only for consistency with the rest of this data-population
-- pass (docs/operators.md sourcing caveat), even though which continent
-- a country is on is about as low-risk a fact as exists.
--
-- Idempotent: safe to re-run.

with src as (
  insert into data_sources (name, source_type, reliability, notes)
  values ('Standard travel-industry continent grouping', 'editorial', 'medium',
    'Continent assigned per common travel-industry directory conventions (e.g. LiveAboard.com''s destination directory): Asia, Europe, Africa & Middle East, Americas, Pacific.')
  on conflict (name) do update set notes = excluded.notes
  returning id
),
upd as (
  update countries c set continent = v.continent
  from (values
    ('Maldives', 'Asia'),
    ('Indonesia', 'Asia'),
    ('Philippines', 'Asia'),
    ('Malaysia', 'Asia'),
    ('Portugal', 'Europe'),
    ('Egypt', 'Africa & Middle East'),
    ('Mozambique', 'Africa & Middle East'),
    ('South Africa', 'Africa & Middle East'),
    ('Ecuador', 'Americas'),
    ('Mexico', 'Americas'),
    ('Bonaire', 'Americas'),
    ('Palau', 'Pacific'),
    ('Fiji', 'Pacific'),
    ('Australia', 'Pacific'),
    ('French Polynesia', 'Pacific')
  ) as v(name, continent)
  where c.name = v.name
  returning c.id, c.continent
)
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'country', upd.id, 'continent',
  jsonb_build_object('continent', upd.continent),
  src.id, 'editorial', now(), 'medium', 'verified', false
from upd, src
where not exists (
  select 1 from data_claims c
  where c.entity_type = 'country' and c.entity_id = upd.id and c.field_name = 'continent'
);
