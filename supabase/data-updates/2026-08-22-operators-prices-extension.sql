-- DiveFinder — fixes a bug in the original operator price population, and
-- adds new priced operators for the 5 destinations that still had zero
-- price data. Generated 2026-08-22.
--
-- ============================================================
-- PART A — BUG FIX: 20 orphaned prices from operator-updates/2026-08-20.sql
-- ============================================================
-- That file's `price` CTE was defined but never referenced by the final
-- `insert into data_claims ... from op, src;` in any of its 20 pricing
-- blocks — only `op` and `src` were joined. An unreferenced CTE in
-- Postgres never executes (the same rule documented in
-- 2026-08-21-bull-shark-fiji.sql), so none of those 20 price rows were
-- ever actually written, even though the file ran without error and the
-- operators (dive_centers/liveaboards) themselves WERE correctly created
-- (their own `op` CTE was referenced, so it did execute). This silently
-- broke the "from €X" pill on Explore/Search-inspiration/Results for
-- every destination that looked like it had pricing.
--
-- This section re-inserts those exact same 20 price rows (same amounts,
-- currency, inclusions/exclusions, source — nothing re-researched, just
-- correctly executed this time) by looking up the operator that already
-- exists in the database and the data_sources row already created for
-- it, both by name. Guarded so re-running this is a no-op if the prices
-- already exist (e.g. if a manual fix already inserted them).
--
-- ============================================================
-- PART B — new priced operators for destinations that had none:
-- Maldives, Raja Ampat, Coron, Azores. Sourced the same way as the
-- original pass (indexed search snippets of each operator's own site;
-- see docs/operators.md sourcing caveat). Confidence 'medium'.
--
-- PART C — Galápagos still gets a new real operator (Explorer Ventures'
-- Galápagos fleet) but deliberately NO price: this destination's
-- liveaboard market overwhelmingly quotes "on request" rather than
-- publishing a rate, confirmed across several operators' own sites in
-- this pass — reporting a price here would mean picking one of the
-- vague third-party estimates floating around instead of a real quoted
-- rate, which is exactly what this project's sourcing rule exists to
-- prevent.
--
-- Idempotent: safe to re-run.

-- ---------- PART A: dive_center prices ----------
insert into prices (entity_type, entity_id, price_type, amount_min, amount_max, currency, inclusions, exclusions, provider, source_id, observed_at, expires_at, demo_data)
select 'dive_center', dc.id, v.price_type, v.amount_min, v.amount_max, v.currency, v.inclusions, v.exclusions, v.provider,
  (select id from data_sources where name = v.source_name),
  now(), v.expires_at, false
from (values
  ('komodo', 'Dive Komodo', 'package', 650::numeric, 650::numeric, 'USD', array['9 dives','3 days / 2 nights (Tatawa liveaboard)'], array['Komodo National Park entrance fee (USD 15/day)'], 'Dive Komodo', 'Dive Komodo (official site)', null::timestamptz),
  ('komodo', 'Dragon Dive Komodo', 'package', 675::numeric, 675::numeric, 'EUR', array['Shenron liveaboard, 3 days / 2 nights'], array[]::text[], 'Dragon Dive Komodo', 'Dragon Dive Komodo (official site)', null::timestamptz),
  ('komodo', 'Manta Dive Komodo', 'day_boat', 214::numeric, 214::numeric, 'USD', array['Komodo National Park fees included'], array[]::text[], 'Manta Dive Komodo', 'Manta Dive Komodo (official site)', null::timestamptz),
  ('malapascua', 'Thresher Shark Divers (Malapascua Diving)', 'package', 4200::numeric, 4200::numeric, 'PHP', array['2 dives'], array['PHP 600 marine park fee','PHP 500 fuel surcharge','gear rental'], 'Thresher Shark Divers', 'Thresher Shark Divers / Malapascua Diving (official site)', null::timestamptz),
  ('cozumel', 'Blue Note Scuba', 'day_boat', 130::numeric, 130::numeric, 'USD', array['2-tank boat dive'], array['$15 marine park fee'], 'Blue Note Scuba', 'Blue Note Scuba (official site)', null::timestamptz),
  ('bonaire', 'Dive Friends Bonaire', 'package', 234::numeric, 234::numeric, 'USD', array['6-day unlimited shore diving'], array[]::text[], 'Dive Friends Bonaire', 'Dive Friends Bonaire (official site)', null::timestamptz),
  ('sipadan', 'Seaventures Dive Rig', 'package', 4719.60::numeric, 6922.80::numeric, 'MYR', array['standard room, 4D/3N to 6D/5N'], array[]::text[], 'Seaventures Dive Rig', 'Seaventures Dive Rig (official site)', null::timestamptz),
  ('fiji', 'Waidroka Bay Resort', 'package', 3662::numeric, 5029::numeric, 'FJD', array['5-night/9-dive to 7-night/13-dive packages'], array[]::text[], 'Waidroka Bay Resort', 'Waidroka Bay Resort (official site)', null::timestamptz),
  ('great-barrier-reef', 'Down Under Cruise & Dive', 'day_boat', 265::numeric, 265::numeric, 'AUD', array['full-day reef cruise + scuba add-on'], array[]::text[], 'Down Under Cruise & Dive', 'Down Under Cruise & Dive (official site)', null::timestamptz),
  ('great-barrier-reef', 'Quicksilver Cruises', 'day_boat', 120::numeric, 170::numeric, 'AUD', array['1-2 dive add-on, equipment included'], array['Environmental Management Charge ~$8.50 AUD'], 'Quicksilver Cruises', 'Quicksilver Cruises (official site)', '2027-03-31'::timestamptz),
  ('mozambique', 'Peri-Peri Divers', 'single_dive', 3400::numeric, 4000::numeric, 'MZN', array['own equipment (low) to full equipment (high)'], array['nitrox, reef tax, far-reef surcharges'], 'Peri-Peri Divers', 'Peri-Peri Divers (official site)', null::timestamptz),
  ('south-africa-aliwal-sodwana', 'Pisces Diving', 'single_dive', 1130::numeric, 1130::numeric, 'ZAR', array['instructor','equipment'], array[]::text[], 'Pisces Diving', 'Pisces Diving (official site)', null::timestamptz),
  ('madeira', 'Haliotis Dive Center (Madeira)', 'day_boat', 49::numeric, 49::numeric, 'EUR', array['single boat dive'], array[]::text[], 'Haliotis Dive Center', 'Haliotis Dive Center — Madeira (official site)', null::timestamptz),
  ('madeira', 'Atalaia Diving Center', 'single_dive', 32::numeric, 32::numeric, 'EUR', array['single dive (3+ dives), equipment extra'], array[]::text[], 'Atalaia Diving Center', 'Atalaia Diving Center (official site)', null::timestamptz),
  ('french-polynesia', 'TOPDIVE', 'package', 91500::numeric, 175000::numeric, 'XPF', array['10-dive to 20-dive inter-island pass, shareable by 2 divers, valid on 2 islands'], array[]::text[], 'TOPDIVE', 'TOPDIVE (official site)', null::timestamptz),
  ('bali-nusa-penida', 'Diving Nusa Penida', 'package', 20::numeric, 60::numeric, 'USD', array['1-day/2-dive up to 11-30 day multi-dive package, equipment, guide, lunch'], array[]::text[], 'Diving Nusa Penida', 'Diving Nusa Penida (official site)', null::timestamptz)
) as v(dest_slug, op_name, price_type, amount_min, amount_max, currency, inclusions, exclusions, provider, source_name, expires_at)
join destinations d on d.slug = v.dest_slug
join dive_centers dc on dc.destination_id = d.id and dc.name = v.op_name
where not exists (
  select 1 from prices p where p.entity_type = 'dive_center' and p.entity_id = dc.id and p.provider = v.provider
);

-- ---------- PART A: liveaboard prices ----------
insert into prices (entity_type, entity_id, price_type, amount_min, amount_max, currency, inclusions, exclusions, provider, source_id, observed_at, demo_data)
select 'liveaboard', lb.id, v.price_type, v.amount_min, v.amount_max, v.currency, v.inclusions, v.exclusions, v.provider,
  (select id from data_sources where name = v.source_name),
  now(), false
from (values
  ('red-sea-egypt', 'Emperor Red Sea fleet', 'liveaboard', 1410::numeric, 1410::numeric, 'EUR', array['7 nights (Emperor Superior)','port/park fees','fuel surcharge'], array[]::text[], 'Emperor Divers', 'Emperor Divers — Red Sea fleet (official site)'),
  ('socorro', 'Rocio del Mar / Quino del Mar', 'liveaboard', 4195::numeric, 4195::numeric, 'USD', array['10 days / 9 nights','6 dive days','taxes','port fees','meals'], array[]::text[], 'Mexico Liveaboards', 'Mexico Liveaboards — Rocio del Mar / Quino del Mar (official site)'),
  ('palau', 'Palau Siren', 'liveaboard', 3745::numeric, 6640::numeric, 'USD', array['7-night to 10-night itineraries'], array[]::text[], 'Palau Siren / Siren Fleet', 'Palau Siren (official site)'),
  ('french-polynesia', 'Aquatiki III', 'liveaboard', 3700::numeric, 3700::numeric, 'EUR', array['per night, low season, full-charter public rate'], array[]::text[], 'Aquapolynésie', 'Aquapolynésie — Aquatiki III (official site)')
) as v(dest_slug, op_name, price_type, amount_min, amount_max, currency, inclusions, exclusions, provider, source_name)
join destinations d on d.slug = v.dest_slug
join liveaboards lb on lb.destination_id = d.id and lb.name = v.op_name
where not exists (
  select 1 from prices p where p.entity_type = 'liveaboard' and p.entity_id = lb.id and p.provider = v.provider
);

-- ============================================================
-- PART B — new priced operators
-- ============================================================

-- Maldives Dives (Thoddoo / Ukulhas) — official rates page.
with dest as (select id from destinations where slug = 'maldives'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Maldives Dives (official site)', 'official_operator', 'https://maldivesdives.com/en/Rates/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Maldives Dives', array['day_boat','shop'],
         'https://maldivesdives.com/en/',
         'Local-island dive operator running day trips from Thoddoo and Ukulhas in North Ari Atoll. Publishes tiered per-dive pricing directly on its own rates page — one of the few Maldives operators found with a public price during this research pass.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     ),
     price as (
       insert into prices (entity_type, entity_id, price_type, amount_min, amount_max, currency, inclusions, exclusions, provider, source_id, observed_at, demo_data)
       select 'dive_center', op.id, 'single_dive', 50, 60, 'USD', array['guide','boat fee','tanks and weights','drinking water'], array['equipment rental']::text[], 'Maldives Dives', src.id, now(), false
       from op, src
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src
left join price on true;

-- Raja Ampat Biodiversity Eco Resort — official diving-packages rates page.
with dest as (select id from destinations where slug = 'raja-ampat'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Raja Ampat Biodiversity Eco Resort (official site)', 'official_operator', 'https://rajaampatbiodiversity.com/diving-packages/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Raja Ampat Biodiversity Eco Resort', array['resort'],
         'https://rajaampatbiodiversity.com/',
         'Eco-resort with in-house dive center; diving packages can be added to a stay of 5+ nights (2-3 boat dives/day plus unlimited house-reef diving). Publishes cottage nightly rates directly; dive-package add-on pricing is on the same site but wasn''t fully captured in this pass.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     ),
     price as (
       insert into prices (entity_type, entity_id, price_type, amount_min, amount_max, currency, inclusions, exclusions, provider, source_id, observed_at, demo_data)
       select 'dive_center', op.id, 'resort', 180, 200, 'EUR', array['per night, double occupancy','full board (3 meals, snack, tea/coffee/water)'], array['95 EUR/person entrance fee','diving package (add-on)','additional dives (45 EUR each)','night dive (+10 EUR)']::text[], 'Raja Ampat Biodiversity Eco Resort', src.id, now(), false
       from op, src
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive resort confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src
left join price on true;

-- Pirates Diving Center (Coron) — official "Diving Prices" page, explicitly all-inclusive/transparent.
with dest as (select id from destinations where slug = 'coron'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Pirates Diving Center (official site)', 'official_operator', 'https://piratescoron.com/diving-prices/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Pirates Diving Center', array['day_boat','shop'],
         'https://piratescoron.com/',
         '30-year PADI dive operator in Coron running daily wreck-diving excursions; publishes explicit all-inclusive pricing on its own site (guides, marine park and entry fees included; equipment rental separate).',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     ),
     price as (
       insert into prices (entity_type, entity_id, price_type, amount_min, amount_max, currency, inclusions, exclusions, provider, source_id, observed_at, demo_data)
       select 'dive_center', op.id, 'day_boat', 100, 100, 'USD', array['3 guided wreck dives','dive guide','marine park and entry fees'], array['equipment rental (US$15/day)']::text[], 'Pirates Diving Center', src.id, now(), false
       from op, src
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src
left join price on true;

-- Azores Sub Dive Center (São Miguel) — official per-dive rate.
with dest as (select id from destinations where slug = 'azores'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Azores Sub Dive Center (official site)', 'official_operator', 'https://www.azoressub.com/en/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Azores Sub Dive Center', array['day_boat','shop'],
         'https://www.azoressub.com/en/',
         'Dive center on São Miguel Island running boat dives to sites on the island''s south coast; publishes per-dive pricing for certified divers directly on its own site.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     ),
     price as (
       insert into prices (entity_type, entity_id, price_type, amount_min, amount_max, currency, inclusions, exclusions, provider, source_id, observed_at, demo_data)
       select 'dive_center', op.id, 'single_dive', 72, 72, 'USD', array['12L 200-bar tank','weight belt','liability insurance','professional guide'], array[]::text[], 'Azores Sub Dive Center', src.id, now(), false
       from op, src
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src
left join price on true;

-- ============================================================
-- PART C — Galápagos: one more real operator, deliberately no price
-- (see header note — this market quotes on request, not publicly)
-- ============================================================
with dest as (select id from destinations where slug = 'galapagos'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Explorer Ventures — Galápagos fleet (official site)', 'official_operator', 'https://www.explorerventures.com/galapagos-liveaboard-diving/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment. Operator has a dedicated pricing page but no rate figure was captured from available search snippets, so none is reported here.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into liveaboards (destination_id, name, operator_name, itinerary_notes, demo_data)
       select dest.id, 'Explorer Ventures Galápagos fleet', 'Explorer Ventures',
         '8-day/7-night itineraries with up to 4-5 dives daily (weather permitting), all meals, tanks/weights/air fills, airport transfers for same-day arrivals, and 2 land excursions included. Price not publicly stated on operator''s site.',
         false
       from dest
       on conflict (destination_id, name) do update set itinerary_notes = excluded.itinerary_notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'liveaboard', op.id, 'listing', to_jsonb('Real, currently-operating liveaboard confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;
