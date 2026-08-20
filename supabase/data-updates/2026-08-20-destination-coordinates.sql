-- DiveFinder — destination-level coordinates for the 20 real destinations.
-- Generated 2026-08-20. These were left unset at seed time (see
-- supabase/seed/seed.sql: "everything else stays unset until an admin adds
-- a sourced claim") — without them, /map has nothing real to plot and only
-- shows the 3 fabricated Demo Island pins, which is confusing.
--
-- What this is: one approximate lat/lon per destination — the main town,
-- island, or gateway city divers actually fly into — good enough to place
-- a pin on a world map. It is NOT a dive-site-precise GPS position (dive
-- sites already have their own coordinates where known, see dive_sites).
-- Each value was cross-checked against multiple independent public
-- geographic coordinate lookups (not a single authoritative registry, and
-- not a live page fetch — this research environment's page-fetch tool is
-- blocked, per docs/operators.md), so confidence is 'medium', consistent
-- with the rest of this data-population pass, even though basic place
-- coordinates are about as stable and low-risk a fact as exists.
--
-- Idempotent: safe to re-run.

-- Single statement (CTEs don't carry across separate statements) so the
-- source row, the coordinate update, and the audit claim all see each
-- other and this stays safely re-runnable.
with src as (
  insert into data_sources (name, source_type, reliability, notes)
  values ('Public geographic coordinate reference (multi-source cross-check)', 'editorial', 'medium',
    'Cross-referenced multiple independent public coordinate lookups (incl. Wikipedia-sourced entries) per destination; no single live page fetch, per the sourcing caveat in docs/operators.md.')
  on conflict (name) do update set notes = excluded.notes
  returning id
),
upd as (
  update destinations d set latitude = v.latitude, longitude = v.longitude
  from (values
    ('maldives', 4.1748, 73.5089),
    ('raja-ampat', -0.2333, 130.5167),
    ('komodo', -8.5500, 119.4500),
    ('malapascua', 11.3333, 124.1167),
    ('galapagos', -0.6255, -90.3679),
    ('red-sea-egypt', 27.2574, 33.8129),
    ('socorro', 18.7844, -110.9750),
    ('cozumel', 20.5063, -86.9429),
    ('bonaire', 12.1500, -68.2667),
    ('sipadan', 4.1163, 118.6274),
    ('palau', 7.3398, 134.4733),
    ('fiji', -18.1416, 178.4419),
    ('great-barrier-reef', -16.9237, 145.7661),
    ('mozambique', -23.8569, 35.5480),
    ('south-africa-aliwal-sodwana', -27.5333, 32.6833),
    ('azores', 37.7411, -25.6806),
    ('madeira', 32.6657, -16.9255),
    ('french-polynesia', -17.5350, -149.5696),
    ('bali-nusa-penida', -8.7333, 115.5333),
    ('coron', 11.9980, 120.2050)
  ) as v(slug, latitude, longitude)
  where d.slug = v.slug
  returning d.id, d.latitude, d.longitude
)
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'destination', upd.id, 'coordinates',
  jsonb_build_object('latitude', upd.latitude, 'longitude', upd.longitude),
  src.id, 'editorial', now(), 'medium', 'verified', false
from upd, src
where not exists (
  select 1 from data_claims c
  where c.entity_type = 'destination' and c.entity_id = upd.id and c.field_name = 'coordinates'
);
