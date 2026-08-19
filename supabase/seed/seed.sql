-- DiveFinder — seed data (pure SQL version, for pasting into the Supabase
-- SQL Editor when the CLI/service-role script can't be run from a
-- restricted network). Mirrors supabase/seed/data.ts + seed.ts exactly.
--
-- Safe to re-run: every insert uses ON CONFLICT DO NOTHING on the table's
-- natural unique key (slug/name), so running this twice never duplicates
-- rows. Run supabase/all_migrations.sql FIRST — this script assumes the
-- schema already exists.

-- ── Countries ───────────────────────────────────────────────────────────
insert into countries (name, iso_code) values
  ('Maldives', 'MV'),
  ('Indonesia', 'ID'),
  ('Philippines', 'PH'),
  ('Ecuador', 'EC'),
  ('Egypt', 'EG'),
  ('Mexico', 'MX'),
  ('Bonaire', 'BQ'),
  ('Malaysia', 'MY'),
  ('Palau', 'PW'),
  ('Fiji', 'FJ'),
  ('Australia', 'AU'),
  ('Mozambique', 'MZ'),
  ('South Africa', 'ZA'),
  ('Portugal', 'PT'),
  ('French Polynesia', 'PF')
on conflict (name) do nothing;

-- ── Real destinations — name/slug/country ONLY, everything else stays
-- unset until an admin adds a sourced claim (see docs/data-governance.md).
insert into destinations (slug, name, country_id, status, demo_data)
select v.slug, v.name, c.id, 'published', false
from (values
  ('maldives', 'Maldives', 'Maldives'),
  ('raja-ampat', 'Raja Ampat', 'Indonesia'),
  ('komodo', 'Komodo', 'Indonesia'),
  ('malapascua', 'Malapascua', 'Philippines'),
  ('galapagos', 'Galápagos', 'Ecuador'),
  ('red-sea-egypt', 'Red Sea — Egypt', 'Egypt'),
  ('socorro', 'Socorro', 'Mexico'),
  ('cozumel', 'Cozumel', 'Mexico'),
  ('bonaire', 'Bonaire', 'Bonaire'),
  ('sipadan', 'Sipadan', 'Malaysia'),
  ('palau', 'Palau', 'Palau'),
  ('fiji', 'Fiji', 'Fiji'),
  ('great-barrier-reef', 'Great Barrier Reef', 'Australia'),
  ('mozambique', 'Mozambique', 'Mozambique'),
  ('south-africa-aliwal-sodwana', 'South Africa — Aliwal/Sodwana', 'South Africa'),
  ('azores', 'Azores', 'Portugal'),
  ('madeira', 'Madeira', 'Portugal'),
  ('french-polynesia', 'French Polynesia', 'French Polynesia'),
  ('bali-nusa-penida', 'Bali / Nusa Penida', 'Indonesia'),
  ('coron', 'Coron', 'Philippines')
) as v(slug, name, country_name)
left join countries c on c.name = v.country_name
on conflict (slug) do nothing;

-- ── Marine species ──────────────────────────────────────────────────────
insert into marine_species (slug, common_name, scientific_name, category) values
  ('whale-shark', 'Whale shark', 'Rhincodon typus', 'shark'),
  ('oceanic-manta-ray', 'Oceanic manta ray', 'Mobula birostris', 'ray'),
  ('reef-manta-ray', 'Reef manta ray', 'Mobula alfredi', 'ray'),
  ('thresher-shark', 'Thresher shark', 'Alopias spp.', 'shark'),
  ('scalloped-hammerhead', 'Scalloped hammerhead', 'Sphyrna lewini', 'shark'),
  ('tiger-shark', 'Tiger shark', 'Galeocerdo cuvier', 'shark'),
  ('bull-shark', 'Bull shark', 'Carcharhinus leucas', 'shark'),
  ('oceanic-whitetip', 'Oceanic whitetip', 'Carcharhinus longimanus', 'shark'),
  ('mola-mola', 'Mola mola', 'Mola mola', 'fish'),
  ('dugong', 'Dugong', 'Dugong dugon', 'mammal'),
  ('humpback-whale', 'Humpback whale', 'Megaptera novaeangliae', 'mammal'),
  ('sea-turtle', 'Sea turtle', 'Chelonioidea', 'turtle')
on conflict (slug) do nothing;

-- ── Certification agencies ──────────────────────────────────────────────
insert into certification_agencies (name, website) values
  ('PADI', 'https://www.padi.com'),
  ('SSI', 'https://www.divessi.com'),
  ('NAUI', 'https://www.naui.org'),
  ('CMAS', 'https://www.cmas.org'),
  ('BSAC', 'https://www.bsac.com'),
  ('RAID', 'https://www.diveraid.com')
on conflict (name) do nothing;

-- ── Certifications (level_rank is an ordering WITHIN one agency only —
-- never a cross-agency equivalence, see docs/data-model.md) ─────────────
insert into certifications (agency_id, name, level_rank)
select a.id, v.name, v.level_rank
from (values
  ('PADI', 'Open Water Diver', 1),
  ('PADI', 'Advanced Open Water Diver', 2),
  ('PADI', 'Rescue Diver', 3),
  ('PADI', 'Divemaster', 4),
  ('SSI', 'Open Water Diver', 1),
  ('SSI', 'Advanced Adventurer', 2),
  ('SSI', 'Dive Guide', 3),
  ('NAUI', 'Scuba Diver', 1),
  ('NAUI', 'Advanced Scuba Diver', 2),
  ('CMAS', 'One Star Diver (P1)', 1),
  ('CMAS', 'Two Star Diver (P2)', 2),
  ('CMAS', 'Three Star Diver (P3)', 3),
  ('BSAC', 'Ocean Diver', 1),
  ('BSAC', 'Sports Diver', 2),
  ('BSAC', 'Dive Leader', 3),
  ('RAID', 'Open Water 20', 1),
  ('RAID', 'Advanced 35', 2)
) as v(agency_name, name, level_rank)
join certification_agencies a on a.name = v.agency_name
on conflict (agency_id, name) do nothing;

-- ── DEMO destinations — fully fabricated, demo_data = true end to end,
-- isolated from real destinations everywhere in the app. ────────────────
insert into destinations (slug, name, summary, latitude, longitude, dive_type_tags, status, demo_data) values
  ('demo-island-a', 'Demo Island A',
   'Illustrative placeholder destination used to demonstrate the DiveFinder UI end to end. All figures below are fabricated demo data, not real observations.',
   4.1755, 73.5093, array['reef','pelagic','boat','liveaboard'], 'published', true),
  ('demo-island-b', 'Demo Island B',
   'Illustrative placeholder destination (macro / muck diving profile) used to demonstrate filtering and comparison. All figures are fabricated demo data.',
   -8.6705, 115.2126, array['muck','macro','shore','photo_friendly'], 'published', true),
  ('demo-island-c', 'Demo Island C',
   'Illustrative placeholder destination (wreck / wall diving profile) used to demonstrate the compare and map screens. All figures are fabricated demo data.',
   27.2579, 33.8116, array['wreck','wall','boat'], 'published', true)
on conflict (slug) do nothing;

-- ── DEMO dive sites — one per demo destination ──────────────────────────
insert into dive_sites (slug, destination_id, name, latitude, longitude, access_type, site_type, min_depth_m, max_depth_m, typical_current, typical_visibility_m_min, typical_visibility_m_max, recommended_level, hazards, status, demo_data)
select 'demo-island-a-north-wall', d.id, 'North Wall (Demo)', 4.185, 73.515, 'boat', array['wall','pelagic'], 5, 40, 'moderate', 15, 30, 'Advanced Open Water (demo)', array['Strong current possible (demo)'], 'published', true
from destinations d where d.slug = 'demo-island-a'
on conflict (slug) do nothing;

insert into dive_sites (slug, destination_id, name, latitude, longitude, access_type, site_type, min_depth_m, max_depth_m, typical_current, typical_visibility_m_min, typical_visibility_m_max, recommended_level, hazards, status, demo_data)
select 'demo-island-b-muck-flats', d.id, 'Muck Flats (Demo)', -8.675, 115.22, 'shore', array['muck','macro'], 3, 18, 'mild', 8, 15, 'Open Water (demo)', array[]::text[], 'published', true
from destinations d where d.slug = 'demo-island-b'
on conflict (slug) do nothing;

insert into dive_sites (slug, destination_id, name, latitude, longitude, access_type, site_type, min_depth_m, max_depth_m, typical_current, typical_visibility_m_min, typical_visibility_m_max, recommended_level, hazards, status, demo_data)
select 'demo-island-c-wreck-point', d.id, 'Wreck Point (Demo)', 27.26, 33.82, 'boat', array['wreck','wall'], 12, 35, 'variable', 10, 25, 'Advanced Open Water (demo)', array['Penetration requires wreck specialty (demo)'], 'published', true
from destinations d where d.slug = 'demo-island-c'
on conflict (slug) do nothing;

-- ── DEMO environmental seasonality (Demo Island A, months 1-4) ──────────
insert into environmental_seasonality (destination_id, month, water_temp_c_min, water_temp_c_max, visibility_m_min, visibility_m_max, typical_conditions, source_id, demo_data)
select d.id, m, 26, 29, 15, 30, 'Calm mornings, moderate afternoon current (demo)', '00000000-0000-0000-0000-000000000001', true
from destinations d, generate_series(1, 4) as m
where d.slug = 'demo-island-a'
  and not exists (
    select 1 from environmental_seasonality e where e.destination_id = d.id and e.month = m and e.demo_data = true
  );

-- ── DEMO species seasonality + destination_species links (Demo Island A) ─
insert into species_seasonality (destination_id, species_id, month, suitability, source_id, demo_data)
select d.id, s.id, m, case when s.slug = 'whale-shark' then 'good' else 'excellent' end,
       '00000000-0000-0000-0000-000000000001', true
from destinations d
cross join marine_species s
cross join generate_series(1, 3) as m
where d.slug = 'demo-island-a'
  and s.slug in ('whale-shark', 'oceanic-manta-ray')
  and not exists (
    select 1 from species_seasonality ss
    where ss.destination_id = d.id and ss.species_id = s.id and ss.month = m and ss.demo_data = true
  );

insert into destination_species (destination_id, species_id, demo_data)
select d.id, s.id, true
from destinations d
cross join marine_species s
where d.slug = 'demo-island-a'
  and s.slug in ('whale-shark', 'oceanic-manta-ray')
on conflict (destination_id, species_id) do nothing;

-- ── DEMO prices (Demo Island A package) ─────────────────────────────────
insert into prices (entity_type, entity_id, price_type, amount_min, amount_max, currency, inclusions, exclusions, provider, source_id, observed_at, expires_at, demo_data)
select 'destination', d.id, 'package', 1200, 1800, 'EUR',
       array['6 nights accommodation (demo)', '10 boat dives (demo)'], array['Flights', 'Nitrox'],
       'Demo Dive Resort', '00000000-0000-0000-0000-000000000001', now(), now() + interval '30 days', true
from destinations d
where d.slug = 'demo-island-a'
  and not exists (select 1 from prices p where p.entity_id = d.id and p.demo_data = true);

-- ── DEMO data claims — one verified, one intentionally EXPIRED (proves an
-- expired claim is never shown as current, see docs/data-governance.md) ─
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, verified_at, confidence, review_status, demo_data)
select 'destination', d.id, 'recommended_level', '"Advanced Open Water (demo)"'::jsonb,
       '00000000-0000-0000-0000-000000000001', 'demo', now(), now(), 'low', 'verified', true
from destinations d
where d.slug = 'demo-island-a'
  and not exists (
    select 1 from data_claims c where c.entity_id = d.id and c.field_name = 'recommended_level' and c.demo_data = true
  );

insert into data_claims (entity_type, entity_id, field_name, value_json, unit, source_id, source_type, observed_at, expires_at, confidence, review_status, demo_data)
select 'destination', d.id, 'amount_min', '900'::jsonb, 'EUR',
       '00000000-0000-0000-0000-000000000001', 'demo', now() - interval '200 days', now() - interval '30 days', 'low', 'verified', true
from destinations d
where d.slug = 'demo-island-a'
  and not exists (
    select 1 from data_claims c where c.entity_id = d.id and c.field_name = 'amount_min' and c.demo_data = true
  );

-- ── Admin review queue sample (Maldives is missing sourced data) ────────
insert into admin_review_queue (entity_type, entity_id, reason, status, notes)
select 'destination', d.id, 'missing_field', 'open', d.name || ' has no verified critical fields yet — needs sourced data.'
from destinations d
where d.slug = 'maldives'
  and not exists (
    select 1 from admin_review_queue q where q.entity_id = d.id and q.reason = 'missing_field'
  );

-- ── Data refresh job placeholders ────────────────────────────────────────
insert into data_refresh_jobs (job_name, ttl_category, status) values
  ('refresh-prices', 'prices', 'idle'),
  ('refresh-seasonal-editorial', 'seasonal_editorial', 'idle'),
  ('refresh-climate-normals', 'climate_normals', 'idle')
on conflict (job_name) do nothing;
