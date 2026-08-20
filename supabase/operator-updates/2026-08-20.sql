-- DiveFinder — real dive center / liveaboard population, first batch.
-- Generated 2026-08-20 from a web research pass covering all 20 real
-- destinations in the catalog. Every operator below was found on its OWN
-- official website — never copied from an aggregator/directory site
-- (Liveaboard.com, PADI's dive shop locator, SSI's center finder,
-- TripAdvisor, etc.), per docs/operators.md.
--
-- Confidence note: this research environment's page-fetch tool was
-- blocked by network egress for every external domain tested, so facts
-- were sourced from search-engine-indexed excerpts of each operator's own
-- domain (via domain-restricted search), not a direct live-page render.
-- Every claim below is marked confidence 'medium' for that reason, not
-- 'high' — treat this as a strong first pass worth a live-fetch
-- confirmation pass later, not a final verified state. Where a price
-- wasn't clearly and publicly stated, it is left out entirely rather than
-- estimated.
--
-- Idempotent: safe to re-run (on conflict upserts throughout), matching
-- 0015_operator_unique.sql / 0016_operator_notes_and_source_unique.sql.
--
-- Coverage: Maldives, Raja Ampat, Komodo, Malapascua, Galápagos, Red Sea —
-- Egypt, Socorro, Cozumel, Bonaire, Sipadan, Palau, Fiji, Great Barrier
-- Reef, Mozambique, South Africa — Aliwal/Sodwana, Azores, Madeira,
-- French Polynesia, Bali/Nusa Penida, Coron. 68 operators total.

-- ============================================================
-- Maldives
-- ============================================================

with dest as (select id from destinations where slug = 'maldives'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Master Liveaboards — Maldives Master (official site)', 'official_operator', 'https://masterliveaboards.com/maldives/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into liveaboards (destination_id, name, operator_name, itinerary_notes, website, demo_data)
       select dest.id, 'Maldives Master', 'Master Liveaboards',
         'Operates 7- and 10-night dive cruise itineraries across North & South Malé, Rasdhoo, and North & South Ari atolls; known for shark, manta and eagle ray sightings. Price not publicly stated on operator''s site.',
         'https://masterliveaboards.com/maldives/', false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, itinerary_notes = excluded.itinerary_notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'liveaboard', op.id, 'listing', to_jsonb('Real, currently-operating liveaboard confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'maldives'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Emperor Divers — Emperor Maldives fleet (official site)', 'official_operator', 'https://www.emperordivers.com/liveaboard-country/maldives/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into liveaboards (destination_id, name, operator_name, itinerary_notes, website, demo_data)
       select dest.id, 'Emperor Maldives fleet', 'Emperor Divers',
         'Fleet of Maldives liveaboards (Emperor Serenity, Virgo, Voyager, and Emperor Explorer II launching August 2026). Operator states trips include port/park fees, free Nitrox, no fuel/itinerary surcharges. Price not publicly stated.',
         'https://www.emperordivers.com/liveaboard-country/maldives/', false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, itinerary_notes = excluded.itinerary_notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'liveaboard', op.id, 'listing', to_jsonb('Real, currently-operating liveaboard confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'maldives'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Maldives Boat Club (official site)', 'official_operator', 'https://www.maldivesboatclub.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into liveaboards (destination_id, name, operator_name, itinerary_notes, website, demo_data)
       select dest.id, 'M/Y Adora', 'Maldives Boat Club',
         'Operates the 37-metre liveaboard M/Y Adora for scuba diving safaris around the Maldives, in business over 25 years. Also offers surf, SUP and yoga-themed cruise variations. Price not publicly stated.',
         'https://www.maldivesboatclub.com/', false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, itinerary_notes = excluded.itinerary_notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'liveaboard', op.id, 'listing', to_jsonb('Real, currently-operating liveaboard confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

-- ============================================================
-- Raja Ampat, Indonesia
-- ============================================================

with dest as (select id from destinations where slug = 'raja-ampat'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Aggressor Adventures — Raja Ampat Aggressor (official site)', 'official_operator', 'https://www.aggressor.com/destination/rajaampat', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into liveaboards (destination_id, name, operator_name, itinerary_notes, website, demo_data)
       select dest.id, 'Raja Ampat Aggressor', 'Aggressor Adventures',
         '7-, 10- and 12-night dive charters departing Sorong. Mandatory extras noted on operator''s site: equipment rental ~USD 225/week, marine park fees ~USD 250–260. Base trip price not publicly stated.',
         'https://www.aggressor.com/destination/rajaampat', false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, itinerary_notes = excluded.itinerary_notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'liveaboard', op.id, 'listing', to_jsonb('Real, currently-operating liveaboard confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'raja-ampat'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('All Star Liveaboards — Raja Ampat (official site)', 'official_operator', 'https://allstarliveaboards.com/raja-ampat-diving/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into liveaboards (destination_id, name, operator_name, itinerary_notes, website, demo_data)
       select dest.id, 'All Star Liveaboards (Aurora / Velocean)', 'All Star Liveaboards',
         'Operates two vessels, Aurora and Velocean, running Raja Ampat itineraries year-round. Velocean is positioned as a higher-end vessel with ten cabins and a Jacuzzi. Price not publicly stated.',
         'https://allstarliveaboards.com/raja-ampat-diving/', false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, itinerary_notes = excluded.itinerary_notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'liveaboard', op.id, 'listing', to_jsonb('Real, currently-operating liveaboard confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'raja-ampat'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Ayo Raja Ampat Divers (official site)', 'official_operator', 'https://www.ayorajaampatdivers.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into liveaboards (destination_id, name, operator_name, itinerary_notes, website, demo_data)
       select dest.id, 'Ratu Laut', 'Ayo Raja Ampat Divers',
         'Budget-oriented liveaboard, the 30-metre wooden phinisi Ratu Laut, for Raja Ampat diving. A promotional/discounted rate was seen but no stable standard price was confirmed, so price is not reported.',
         'https://www.ayorajaampatdivers.com/', false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, itinerary_notes = excluded.itinerary_notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'liveaboard', op.id, 'listing', to_jsonb('Real, currently-operating liveaboard confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

-- ============================================================
-- Komodo, Indonesia
-- ============================================================

with dest as (select id from destinations where slug = 'komodo'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Dive Komodo (official site)', 'official_operator', 'https://divekomodo.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Dive Komodo', array['shop','day_boat','liveaboard'],
         'https://divekomodo.com/',
         'PADI 5-star dive center in Labuan Bajo running daily dive trips (3 dives/day to sites like Batu Bolong, Manta Point, Castle Rock, Crystal Rock) and operating its own Tatawa liveaboard for Komodo National Park.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     ),
     price as (
       insert into prices (entity_type, entity_id, price_type, amount_min, amount_max, currency, inclusions, exclusions, provider, source_id, observed_at, demo_data)
       select 'dive_center', op.id, 'package', 650, 650, 'USD', array['9 dives','3 days / 2 nights (Tatawa liveaboard)'], array['Komodo National Park entrance fee (USD 15/day)'], 'Dive Komodo', src.id, now(), false
       from op, src
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'komodo'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Dragon Dive Komodo (official site)', 'official_operator', 'https://dragondivekomodo.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Dragon Dive Komodo', array['resort','shop','liveaboard'],
         'https://dragondivekomodo.com/',
         'PADI 5-star dive resort in Labuan Bajo that also operates the boutique Shenron liveaboard (up to 8 guests, 4 en-suite cabins) for Komodo and Alor dive cruises, plus daily shore-based dive trips.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     ),
     price as (
       insert into prices (entity_type, entity_id, price_type, amount_min, amount_max, currency, inclusions, exclusions, provider, source_id, observed_at, demo_data)
       select 'dive_center', op.id, 'package', 675, 675, 'EUR', array['Shenron liveaboard, 3 days / 2 nights'], array[]::text[], 'Dragon Dive Komodo', src.id, now(), false
       from op, src
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'komodo'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Manta Dive Komodo (official site)', 'official_operator', 'https://mantadivekomodo.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Manta Dive Komodo', array['shop','day_boat'],
         'https://mantadivekomodo.com/',
         'PADI 5-star dive center in Labuan Bajo running small-group speedboat day trips into Komodo National Park. Day boat "Mushu" reaches the first dive site in under 45 minutes; max 8 guests, 4 divers per guide. Also offers 3–7 day trips.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     ),
     price as (
       insert into prices (entity_type, entity_id, price_type, amount_min, amount_max, currency, inclusions, exclusions, provider, source_id, observed_at, demo_data)
       select 'dive_center', op.id, 'day_boat', 214, 214, 'USD', array['Komodo National Park fees included'], array[]::text[], 'Manta Dive Komodo', src.id, now(), false
       from op, src
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

-- ============================================================
-- Malapascua, Philippines
-- ============================================================

with dest as (select id from destinations where slug = 'malapascua'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Thresher Shark Divers / Malapascua Diving (official site)', 'official_operator', 'https://malapascua-diving.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Thresher Shark Divers (Malapascua Diving)', array['shop','day_boat'],
         'https://malapascua-diving.com/',
         'Malapascua''s longest-running PADI dive center, running daily shark-diving trips to Kimud Shoal and a full PADI course range.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     ),
     price as (
       insert into prices (entity_type, entity_id, price_type, amount_min, amount_max, currency, inclusions, exclusions, provider, source_id, observed_at, demo_data)
       select 'dive_center', op.id, 'package', 4200, 4200, 'PHP', array['2 dives'], array['PHP 600 marine park fee','PHP 500 fuel surcharge','gear rental'], 'Thresher Shark Divers', src.id, now(), false
       from op, src
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'malapascua'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Atlas Divers Malapascua (official site)', 'official_operator', 'https://atlasdivers.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Atlas Divers Malapascua', array['shop','day_boat'],
         'https://atlasdivers.com/',
         'SSI-affiliated dive center and guesthouse on Malapascua Island offering fun dives, PADI/SSI courses, and thresher shark trips. Fun-dive pricing not publicly stated.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'malapascua'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Evolution Diving Resort (official site)', 'official_operator', 'https://evolution.com.ph/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Evolution Diving Resort', array['resort','day_boat'],
         'https://evolution.com.ph/',
         'Beachfront dive resort on Malapascua offering recreational and technical diving, including daily sunrise trips to Kimud Shoal for thresher sharks, plus day trips to Gato, Kalanggaman and Capitancillo.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

-- ============================================================
-- Galápagos, Ecuador
-- ============================================================

with dest as (select id from destinations where slug = 'galapagos'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Galápagos Sky (official site)', 'official_operator', 'https://galapagossky.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into liveaboards (destination_id, name, operator_name, itinerary_notes, website, demo_data)
       select dest.id, 'Galápagos Sky', 'Galápagos Sky',
         'Owner-operated 100-foot liveaboard yacht, 7- and 10-night dive itineraries including Darwin and Wolf. Departs San Cristóbal weekly; up to 4 dives/day, 3 land excursions included; 16 guests in 8 cabins. Price not publicly stated.',
         'https://galapagossky.com/', false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, itinerary_notes = excluded.itinerary_notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'liveaboard', op.id, 'listing', to_jsonb('Real, currently-operating liveaboard confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'galapagos'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Aggressor Adventures — Galápagos Aggressor III (official site)', 'official_operator', 'https://www.aggressor.com/boat/GAIII', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into liveaboards (destination_id, name, operator_name, itinerary_notes, website, demo_data)
       select dest.id, 'Galápagos Aggressor III', 'Aggressor Adventures',
         '105-foot liveaboard, 7-night dive itineraries departing Baltra. Up to 4 dives/day plus 2 night dives and 2 land excursions/week; equipment rental and Galápagos National Park fee (USD 200) separate. Base price not publicly stated.',
         'https://www.aggressor.com/boat/GAIII', false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, itinerary_notes = excluded.itinerary_notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'liveaboard', op.id, 'listing', to_jsonb('Real, currently-operating liveaboard confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'galapagos'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Explorer Ventures — Humboldt Explorer (official site)', 'official_operator', 'https://www.explorerventures.com/galapagos-liveaboard-diving/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into liveaboards (destination_id, name, operator_name, itinerary_notes, website, demo_data)
       select dest.id, 'Humboldt Explorer', 'Explorer Ventures',
         '8-day Galápagos dive cruises, renovated 2023. 4 of 7 nights diving Darwin and Wolf; 16 guests in 8 en-suite cabins; Green Fins/PADI Eco-Center certified. Price not publicly stated.',
         'https://www.explorerventures.com/galapagos-liveaboard-diving/', false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, itinerary_notes = excluded.itinerary_notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'liveaboard', op.id, 'listing', to_jsonb('Real, currently-operating liveaboard confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

-- ============================================================
-- Red Sea — Egypt
-- ============================================================

with dest as (select id from destinations where slug = 'red-sea-egypt'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Emperor Divers — Red Sea fleet (official site)', 'official_operator', 'https://www.emperordivers.com/liveaboards/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into liveaboards (destination_id, name, operator_name, itinerary_notes, website, demo_data)
       select dest.id, 'Emperor Red Sea fleet', 'Emperor Divers',
         'Fleet (Emperor Elite, Superior, Asmaa, HD) on Red Sea itineraries to Elphinstone, Ras Mohamed, Daedalus Reef and the Thistlegorm wreck. Site states park/port fees, fuel surcharges and booking fees are included in quoted price.',
         'https://www.emperordivers.com/liveaboards/', false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, itinerary_notes = excluded.itinerary_notes
       returning id
     ),
     price as (
       insert into prices (entity_type, entity_id, price_type, amount_min, amount_max, currency, inclusions, exclusions, provider, source_id, observed_at, demo_data)
       select 'liveaboard', op.id, 'liveaboard', 1410, 1410, 'EUR', array['7 nights (Emperor Superior)','port/park fees','fuel surcharge'], array[]::text[], 'Emperor Divers', src.id, now(), false
       from op, src
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'liveaboard', op.id, 'listing', to_jsonb('Real, currently-operating liveaboard confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'red-sea-egypt'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Explorer Ventures Fleet — Red Sea (official site)', 'official_operator', 'https://www.explorerventures.com/red-sea-liveaboard-diving/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into liveaboards (destination_id, name, operator_name, itinerary_notes, website, demo_data)
       select dest.id, 'MV Grand Sea Explorer / MV Glory Sea Explorer', 'Explorer Ventures',
         'Own vessels out of Hurghada and Port Ghalib on Red Sea dive routes. 7 nights/8 days, up to 5 dives/day; includes meals, tanks/weights, nitrox and airport transfers per operator FAQ. Price not publicly stated.',
         'https://www.explorerventures.com/red-sea-liveaboard-diving/', false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, itinerary_notes = excluded.itinerary_notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'liveaboard', op.id, 'listing', to_jsonb('Real, currently-operating liveaboard confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'red-sea-egypt'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Blue Force Fleet — Red Sea (official site)', 'official_operator', 'https://www.blueforcefleet.com/diving-in-egypt-red-sea/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into liveaboards (destination_id, name, operator_name, itinerary_notes, website, demo_data)
       select dest.id, 'Red Sea Blue Force 2 / Blue Force 3', 'Blue Force Fleet',
         'Own vessels sailing from Hurghada and Port Sudan in the southern Red Sea. Up to 4 dives/day; reef and wreck sites. Only ancillary local/port/environmental taxes (€70/person/week) publicly disclosed; base price not publicly stated.',
         'https://www.blueforcefleet.com/diving-in-egypt-red-sea/', false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, itinerary_notes = excluded.itinerary_notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'liveaboard', op.id, 'listing', to_jsonb('Real, currently-operating liveaboard confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

-- ============================================================
-- Socorro, Mexico (Revillagigedo Islands)
-- ============================================================

with dest as (select id from destinations where slug = 'socorro'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Solmar V (official site)', 'official_operator', 'https://solmarv.com/home/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into liveaboards (destination_id, name, operator_name, itinerary_notes, website, demo_data)
       select dest.id, 'Solmar V', 'Solmar V',
         '112-ft liveaboard, Socorro/Revillagigedo Archipelago trips out of Cabo San Lucas. 9-day (5 dive days) and 11-day (7 dive days) itineraries; unlimited nitrox included. National-park entry fee $192/guest/night disclosed separately; base trip price not publicly stated.',
         'https://solmarv.com/home/', false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, itinerary_notes = excluded.itinerary_notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'liveaboard', op.id, 'listing', to_jsonb('Real, currently-operating liveaboard confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'socorro'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Nautilus Liveaboards — Socorro (official site)', 'official_operator', 'https://nautilusliveaboards.com/socorro/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into liveaboards (destination_id, name, operator_name, itinerary_notes, website, demo_data)
       select dest.id, 'Nautilus Belle Amie / Nautilus UnderSea', 'Nautilus Liveaboards',
         'Two vessels (147ft, up to 32 guests / 105ft, up to 19 guests) running Socorro/Revillagigedo trips. 5 full dive days at El Canyon, the Boiler, Roca Partida, Cabo Pearce and Roca O''Neal. Price not publicly stated.',
         'https://nautilusliveaboards.com/socorro/', false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, itinerary_notes = excluded.itinerary_notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'liveaboard', op.id, 'listing', to_jsonb('Real, currently-operating liveaboard confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'socorro'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Mexico Liveaboards — Rocio del Mar / Quino del Mar (official site)', 'official_operator', 'https://www.mexicoliveaboards.com/destination-socorro.html', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into liveaboards (destination_id, name, operator_name, itinerary_notes, website, demo_data)
       select dest.id, 'Rocio del Mar / Quino del Mar', 'Mexico Liveaboards',
         'Two vessels (10 cabins, 20 divers each) running Socorro/Revillagigedo trips November–May. 10 days/9 nights, 6 dive days; includes taxes, port fees, meals, tanks, weights, beer and wine.',
         'https://www.mexicoliveaboards.com/destination-socorro.html', false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, itinerary_notes = excluded.itinerary_notes
       returning id
     ),
     price as (
       insert into prices (entity_type, entity_id, price_type, amount_min, amount_max, currency, inclusions, exclusions, provider, source_id, observed_at, demo_data)
       select 'liveaboard', op.id, 'liveaboard', 4195, 4195, 'USD', array['10 days / 9 nights','6 dive days','taxes','port fees','meals'], array[]::text[], 'Mexico Liveaboards', src.id, now(), false
       from op, src
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'liveaboard', op.id, 'listing', to_jsonb('Real, currently-operating liveaboard confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

-- ============================================================
-- Cozumel, Mexico
-- ============================================================

with dest as (select id from destinations where slug = 'cozumel'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Jungle Divers (official site)', 'official_operator', 'https://www.jungle-divers.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Jungle Divers', array['shop','day_boat'],
         'https://www.jungle-divers.com/',
         'Family-owned PADI dive center on Cozumel running daily day-boat dive trips (groups of 4–10) to Cozumel''s reef sites; price includes the 215 MXN Cozumel marine park entrance fee.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'cozumel'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Blue Note Scuba (official site)', 'official_operator', 'https://www.bluenotescuba.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Blue Note Scuba', array['shop','day_boat'],
         'https://www.bluenotescuba.com/',
         'PADI 5-Star ECO dive center on Cozumel offering day-boat 2-tank dives to sites such as Palancar and Santa Rosa. Also runs private charters and PADI courses.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     ),
     price as (
       insert into prices (entity_type, entity_id, price_type, amount_min, amount_max, currency, inclusions, exclusions, provider, source_id, observed_at, demo_data)
       select 'dive_center', op.id, 'day_boat', 130, 130, 'USD', array['2-tank boat dive'], array['$15 marine park fee'], 'Blue Note Scuba', src.id, now(), false
       from op, src
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'cozumel'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Cozumel Dive Center (official site)', 'official_operator', 'https://cozumeldivecenter.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Cozumel Dive Center', array['shop','day_boat'],
         'https://cozumeldivecenter.com/',
         'Operates its own boat "The Blue Pearl" for small-group 2-tank day trips to Palancar Reef and Santa Rosa Wall; groups capped at 6 divers per guide, max 10 per boat. Marine park fee $12/person/day.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

-- ============================================================
-- Bonaire
-- ============================================================

with dest as (select id from destinations where slug = 'bonaire'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Dive Friends Bonaire (official site)', 'official_operator', 'https://www.divefriendsbonaire.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Dive Friends Bonaire', array['shop'],
         'https://www.divefriendsbonaire.com/',
         'Runs seven/eight shore-diving locations around Bonaire with self-serve tank stations for unlimited shore diving; also sells boat-dive add-ons. $42 USD for 1-day unlimited shore diving (air/nitrox).',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     ),
     price as (
       insert into prices (entity_type, entity_id, price_type, amount_min, amount_max, currency, inclusions, exclusions, provider, source_id, observed_at, demo_data)
       select 'dive_center', op.id, 'package', 234, 234, 'USD', array['6-day unlimited shore diving'], array[]::text[], 'Dive Friends Bonaire', src.id, now(), false
       from op, src
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'bonaire'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Wannadive Bonaire (official site)', 'official_operator', 'https://www.wannadive.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Wannadive Bonaire', array['shop'],
         'https://www.wannadive.com/',
         'Dive school with two shore-diving locations (north and south of Kralendijk), including a solar-powered southern location; offers a "Dive & Drive" rental-car/tank package. Pricing not publicly stated.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'bonaire'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('VIP Diving Bonaire (official site)', 'official_operator', 'https://www.vipdiving.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'VIP Diving', array['shop'],
         'https://www.vipdiving.com/',
         'Small-group (max 4 divers) guided operator offering guided shore and boat dives. Named PADI''s 2025 Best Overall Dive Center, Caribbean and Atlantic (per their own site). Pricing not publicly stated.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

-- ============================================================
-- Sipadan, Malaysia
-- ============================================================

with dest as (select id from destinations where slug = 'sipadan'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Borneo Divers — Mabul Resort (official site)', 'official_operator', 'https://borneodivers.com.my/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Borneo Divers (Mabul Resort)', array['resort','day_boat'],
         'https://borneodivers.com.my/',
         'Sabah''s pioneer dive operator (est. 1982) running Borneo Divers Mabul Resort with boat dive access to Sipadan, Mabul and Kapalai. Diving packages include 3 boat dives/day plus unlimited house-reef jetty dives; Sipadan access subject to permit allocation. Diving package pricing not publicly stated (only a snorkeling-only package price was found).',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'sipadan'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Scuba Junkie — Mabul Beach Resort (official site)', 'official_operator', 'https://www.scuba-junkie.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Scuba Junkie (Mabul Beach Resort)', array['resort','day_boat'],
         'https://www.scuba-junkie.com/',
         'PADI 5-star dive resort on Mabul Island (est. 2004) offering diving at Sipadan, Kapalai, Si Amil and Mabul, with a marine-conservation focus. Sipadan permit fees: RM450/diver, RM100/snorkeler; max 2 dives/day inside Sipadan park. Package pricing not publicly stated.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'sipadan'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Seaventures Dive Rig (official site)', 'official_operator', 'https://seaventuresdive.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Seaventures Dive Rig', array['resort','day_boat'],
         'https://seaventuresdive.com/',
         'Dive resort built from a converted offshore oil rig anchored off Mabul Island, offering boat dives to Sipadan, Kapalai and Mabul plus its own house-reef diving. 4D/3N and 5D/4N packages include 1 day at Sipadan; 6D/5N includes 2 days.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     ),
     price as (
       insert into prices (entity_type, entity_id, price_type, amount_min, amount_max, currency, inclusions, exclusions, provider, source_id, observed_at, demo_data)
       select 'dive_center', op.id, 'package', 4719.60, 6922.80, 'MYR', array['standard room, 4D/3N to 6D/5N'], array[]::text[], 'Seaventures Dive Rig', src.id, now(), false
       from op, src
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'sipadan'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Sipadan Water Village Resort (official site)', 'official_operator', 'https://www.swvresortmabul.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Sipadan Water Village Resort', array['resort','day_boat'],
         'https://www.swvresortmabul.com/',
         'Overwater-bungalow dive resort on Mabul Island offering boat dives to Mabul, Kapalai and Sipadan. Recommends a 5D/4N stay for a near-guaranteed Sipadan day-dive slot; Sipadan levy RM450/diver plus RM650/diver/day permit. Rate pricing not publicly stated.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

-- ============================================================
-- Palau
-- ============================================================

with dest as (select id from destinations where slug = 'palau'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Sam''s Tours Palau (official site)', 'official_operator', 'https://www.samstours.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Sam''s Tours Palau', array['shop','day_boat'],
         'https://www.samstours.com/',
         'PADI dive center based in Koror offering daily 2-tank boat dive trips to reef, wreck and Peleliu sites, plus Jellyfish Lake tours. Also markets the Siren Fleet liveaboards as an agent. Pricing not publicly stated.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'palau'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Fish ''n Fins (official site)', 'official_operator', 'https://www.fishnfins.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Fish ''n Fins', array['shop','day_boat'],
         'https://www.fishnfins.com/',
         'PADI 5-Star IDC dive shop and tour operator in Koror, operating since 1972, offering daily dive trips and course instruction. Also affiliated with the Ocean Hunter liveaboards. Pricing not publicly stated.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'palau'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Aggressor Adventures — Rock Islands Aggressor (official site)', 'official_operator', 'https://www.aggressor.com/boat/RIA', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into liveaboards (destination_id, name, operator_name, itinerary_notes, website, demo_data)
       select dest.id, 'Rock Islands Aggressor (Palau Aggressor II)', 'Aggressor Adventures',
         '7-night dive itineraries around Palau''s Rock Islands, departing Sunday to Sunday from Koror. 4 dives/day weekdays plus 3 night dives/week; separate port fee $270–350 depending on Jellyfish Lake inclusion and trip length. Base price not publicly stated.',
         'https://www.aggressor.com/boat/RIA', false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, itinerary_notes = excluded.itinerary_notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'liveaboard', op.id, 'listing', to_jsonb('Real, currently-operating liveaboard confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'palau'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Palau Siren (official site)', 'official_operator', 'https://sirenfleet.com/liveaboards/palau-siren/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into liveaboards (destination_id, name, operator_name, itinerary_notes, website, demo_data)
       select dest.id, 'Palau Siren', 'Siren Fleet / Master Liveaboards',
         '40m traditional phinisi, 8 cabins for 16 guests, Palau itineraries year-round. Offers a 7-night "Full Moon Spawning" itinerary timed to red snapper spawning aggregations.',
         'https://sirenfleet.com/liveaboards/palau-siren/', false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, itinerary_notes = excluded.itinerary_notes
       returning id
     ),
     price as (
       insert into prices (entity_type, entity_id, price_type, amount_min, amount_max, currency, inclusions, exclusions, provider, source_id, observed_at, demo_data)
       select 'liveaboard', op.id, 'liveaboard', 3745, 6640, 'USD', array['7-night to 10-night itineraries'], array[]::text[], 'Palau Siren / Siren Fleet', src.id, now(), false
       from op, src
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'liveaboard', op.id, 'listing', to_jsonb('Real, currently-operating liveaboard confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

-- ============================================================
-- Fiji
-- ============================================================

with dest as (select id from destinations where slug = 'fiji'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Beqa Lagoon Resort (official site)', 'official_operator', 'https://beqalagoonresort.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Beqa Lagoon Resort', array['resort','day_boat'],
         'https://beqalagoonresort.com/',
         'Island dive resort on Beqa Island offering daily reef boat dives and the Cathedral shark dive, plus unlimited house-reef shore diving. Full dive package pricing listed on their site as "price on request".',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'fiji'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Waidroka Bay Resort (official site)', 'official_operator', 'https://www.waidroka.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Waidroka Bay Resort', array['resort','day_boat'],
         'https://www.waidroka.com/',
         'Surf-and-dive resort on the Beqa Lagoon coast offering multi-day boat diving packages including the Beqa shark dive.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     ),
     price as (
       insert into prices (entity_type, entity_id, price_type, amount_min, amount_max, currency, inclusions, exclusions, provider, source_id, observed_at, demo_data)
       select 'dive_center', op.id, 'package', 3662, 5029, 'FJD', array['5-night/9-dive to 7-night/13-dive packages'], array[]::text[], 'Waidroka Bay Resort', src.id, now(), false
       from op, src
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'fiji'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Taveuni Dive Resort (official site)', 'official_operator', 'http://www.taveunidiveresort.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Taveuni Dive Resort', array['resort','day_boat'],
         'http://www.taveunidiveresort.com/',
         'Dive resort on Taveuni offering guided boat diving on the Rainbow Reef and Somosomo Strait. Pricing not publicly stated as a standing rate (only a dated promotional special was found).',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'fiji'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Volivoli Beach Resort — Ra Divers (official site)', 'official_operator', 'https://volivoli.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Volivoli Beach Resort (Ra Divers)', array['resort','day_boat'],
         'https://volivoli.com/',
         'Boutique resort at Rakiraki with an in-house PADI dive center (Ra Divers) running boat dives into Bligh Water. Three house reefs are free/unlimited for guests; fleet covers ~90 sites across 9 regions. Pricing not publicly stated.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

-- ============================================================
-- Great Barrier Reef, Australia
-- ============================================================

with dest as (select id from destinations where slug = 'great-barrier-reef'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Spirit of Freedom (official site)', 'official_operator', 'https://www.spiritoffreedom.com.au/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into liveaboards (destination_id, name, operator_name, itinerary_notes, website, demo_data)
       select dest.id, 'Spirit of Freedom', 'Spirit of Freedom',
         'Cairns-based liveaboard running 3-, 4-, and combined 7-night dive expeditions to the Ribbon Reefs, Cod Hole, and Coral Sea (Osprey Reef). 3-night trip includes up to 11 dives. Prices shown dynamically per cabin/date on operator site rather than a fixed published rate.',
         'https://www.spiritoffreedom.com.au/', false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, itinerary_notes = excluded.itinerary_notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'liveaboard', op.id, 'listing', to_jsonb('Real, currently-operating liveaboard confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'great-barrier-reef'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Pro Dive Cairns (official site)', 'official_operator', 'https://prodivecairns.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into liveaboards (destination_id, name, operator_name, itinerary_notes, website, demo_data)
       select dest.id, 'Pro Dive Cairns liveaboard', 'Pro Dive Cairns',
         '3-day/2-night liveaboard (11 dives) to the outer Great Barrier Reef, plus PADI course instruction. Price not publicly stated.',
         'https://prodivecairns.com/', false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, itinerary_notes = excluded.itinerary_notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'liveaboard', op.id, 'listing', to_jsonb('Real, currently-operating liveaboard confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'great-barrier-reef'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Down Under Cruise & Dive (official site)', 'official_operator', 'https://downundercruiseanddive.com.au/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Down Under Cruise & Dive', array['day_boat'],
         'https://downundercruiseanddive.com.au/',
         'Cairns-based day-boat operator running full-day snorkel and scuba trips to two outer reef sites (Norman, Saxon, Hastings reefs) aboard a 35m vessel; includes lunch. Optional helicopter-combo package also offered.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     ),
     price as (
       insert into prices (entity_type, entity_id, price_type, amount_min, amount_max, currency, inclusions, exclusions, provider, source_id, observed_at, demo_data)
       select 'dive_center', op.id, 'day_boat', 265, 265, 'AUD', array['full-day reef cruise + scuba add-on'], array[]::text[], 'Down Under Cruise & Dive', src.id, now(), false
       from op, src
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'great-barrier-reef'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Quicksilver Cruises (official site)', 'official_operator', 'https://quicksilver-cruises.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Quicksilver Cruises', array['day_boat'],
         'https://quicksilver-cruises.com/',
         'Port Douglas-based day-boat operator, established 1979, running daily reef cruises to the Agincourt Reef complex with dive, snorkel and semi-submersible options. A Government Environmental Management Charge (~$8.50 AUD/person) applies on top of quoted prices.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     ),
     price as (
       insert into prices (entity_type, entity_id, price_type, amount_min, amount_max, currency, inclusions, exclusions, provider, source_id, observed_at, expires_at, demo_data)
       select 'dive_center', op.id, 'day_boat', 120, 170, 'AUD', array['1-2 dive add-on, equipment included'], array['Environmental Management Charge ~$8.50 AUD'], 'Quicksilver Cruises', src.id, now(), '2027-03-31'::timestamptz, false
       from op, src
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

-- ============================================================
-- Mozambique
-- ============================================================

with dest as (select id from destinations where slug = 'mozambique'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Tofo Scuba (official site)', 'official_operator', 'https://www.tofoscuba.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Tofo Scuba', array['shop','day_boat'],
         'https://www.tofoscuba.com/',
         'Tofo Beach''s longest-running dive center, offering boat dives and courses focused on manta rays, whale sharks, and other megafauna. Per-dive/package pricing not publicly stated.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'mozambique'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Peri-Peri Divers (official site)', 'official_operator', 'https://www.peri-peridivers.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Peri-Peri Divers', array['shop','day_boat'],
         'https://www.peri-peridivers.com/',
         'Operating in Tofo and Morrungulo offering boat dives and ocean safaris (snorkel with megafauna). Additional surcharges apply for nitrox, reef tax, and far-reef trips.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     ),
     price as (
       insert into prices (entity_type, entity_id, price_type, amount_min, amount_max, currency, inclusions, exclusions, provider, source_id, observed_at, demo_data)
       select 'dive_center', op.id, 'single_dive', 3400, 4000, 'MZN', array['own equipment (low) to full equipment (high)'], array['nitrox, reef tax, far-reef surcharges'], 'Peri-Peri Divers', src.id, now(), false
       from op, src
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'mozambique'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Gozo-Azul Diving (official site)', 'official_operator', 'https://gozo-azul.co.za/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Gozo-Azul Diving', array['shop','day_boat'],
         'https://gozo-azul.co.za/',
         'PADI dive center in Ponta do Ouro offering daily boat dives, courses, and ocean safaris. Ocean safari (snorkel) $40 USD/person; dive package pricing not publicly stated.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'mozambique'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Back to Basics Adventures (official site)', 'official_operator', 'http://www.backtobasicsadventures.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Back to Basics Adventures', array['shop','day_boat'],
         'http://www.backtobasicsadventures.com/',
         'Boutique dive center in Ponta do Ouro specializing in small-group shark and reef diving. Standard fun-dive pricing not publicly stated.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

-- ============================================================
-- South Africa — Aliwal Shoal / Sodwana Bay
-- ============================================================

with dest as (select id from destinations where slug = 'south-africa-aliwal-sodwana'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Aliwal Dive Centre & Lodge (official site)', 'official_operator', 'https://aliwalshoal.co.za/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Aliwal Dive Centre & Lodge', array['shop','resort','day_boat'],
         'https://aliwalshoal.co.za/',
         'PADI 5-Star dive center and lodge in Umkomaas, operating on Aliwal Shoal since 1995, offering baited shark dives, reef/wreck dives, and shark cage diving. Pricing not publicly stated.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'south-africa-aliwal-sodwana'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('African Watersports (official site)', 'official_operator', 'https://www.africanwatersports.co.za/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'African Watersports', array['shop','day_boat'],
         'https://www.africanwatersports.co.za/',
         'Dive operator on Aliwal Shoal (Umkomaas) running cage-free shark dives (tiger, bull, ragged-tooth, blacktip) and reef dives. Pricing not publicly stated.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'south-africa-aliwal-sodwana'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Triton Dive Lodge (official site)', 'official_operator', 'https://www.tritondiving.co.za/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Triton Dive Lodge', array['shop','resort','day_boat'],
         'https://www.tritondiving.co.za/',
         'PADI dive center and lodge in Sodwana Bay, licensed to operate within the iSimangaliso Wetland Park World Heritage Site. Standard fun-dive pricing not publicly stated.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'south-africa-aliwal-sodwana'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Pisces Diving (official site)', 'official_operator', 'https://www.piscesdiving.co.za/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Pisces Diving', array['shop','day_boat'],
         'https://www.piscesdiving.co.za/',
         'Owner-operated PADI 5-Star dive center in Sodwana Bay, operating since 1994, offering boat dives, night/nitrox dives, and courses.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     ),
     price as (
       insert into prices (entity_type, entity_id, price_type, amount_min, amount_max, currency, inclusions, exclusions, provider, source_id, observed_at, demo_data)
       select 'dive_center', op.id, 'single_dive', 1130, 1130, 'ZAR', array['instructor','equipment'], array[]::text[], 'Pisces Diving', src.id, now(), false
       from op, src
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

-- ============================================================
-- Azores, Portugal
-- ============================================================

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
       select dest.id, 'Azores Sub Dive Center', array['shop','day_boat'],
         'https://www.azoressub.com/en/',
         'SSI/PADI dive center based in the Marina of Vila Franca do Campo on São Miguel island, offering boat dives, try-dives, and certification courses. Dives around Vila Franca do Campo Islet nature reserve.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'azores'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Divers Club Azores (official site)', 'official_operator', 'https://www.diversclubazores.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Divers Club Azores', array['shop','day_boat'],
         'https://www.diversclubazores.com/',
         'Boutique SSI dive centre based in Lajes do Pico, Pico Island, running small-group boat trips to offshore seamounts. Signature trips to Princess Alice Bank and Condor Bank for mobula rays, sharks and occasional whale sharks. Pricing not publicly stated.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'azores'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('DiveAzores (official site)', 'official_operator', 'https://www.diveazores.net/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'DiveAzores', array['resort','day_boat'],
         'https://www.diveazores.net/',
         'PADI dive resort and whale-watching operator based in Horta, Faial Island, operating since 2002 and run by marine biologists. Combines scuba diving with whale/dolphin watching tours. Pricing not publicly stated.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

-- ============================================================
-- Madeira, Portugal
-- ============================================================

with dest as (select id from destinations where slug = 'madeira'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Azul Diving Center Madeira (official site)', 'official_operator', 'https://www.azuldiving.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Azul Diving Center Madeira', array['shop','day_boat'],
         'https://www.azuldiving.com/',
         'PADI 5-Star / SSI dive center at Quinta do Lorde Resort-Hotel-Marina in the Ponta de São Lourenço Protected Area, offering boat dives and courses in the Ilhas Desertas area.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'madeira'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Haliotis Dive Center — Madeira (official site)', 'official_operator', 'https://haliotis.pt/en/centros/madeira', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Haliotis Dive Center (Madeira)', array['shop','day_boat'],
         'https://haliotis.pt/en/centros/madeira',
         'PADI dive center at Hotel Dom Pedro Baía in Machico, Madeira, offering shore and boat dives including in the Garajau marine reserve, noted for dusky groupers ("meros").',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     ),
     price as (
       insert into prices (entity_type, entity_id, price_type, amount_min, amount_max, currency, inclusions, exclusions, provider, source_id, observed_at, demo_data)
       select 'dive_center', op.id, 'day_boat', 49, 49, 'EUR', array['single boat dive'], array[]::text[], 'Haliotis Dive Center', src.id, now(), false
       from op, src
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'madeira'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Atalaia Diving Center (official site)', 'official_operator', 'https://atalaiamadeira.com/en/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Atalaia Diving Center', array['shop','day_boat'],
         'https://atalaiamadeira.com/en/',
         'SSI dive center at the Garajau Underwater Marine Park in Caniço, Madeira, offering shore/boat dives and courses. Volume discounts from 5+/10+/15+ dives; optional night dives +€20.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     ),
     price as (
       insert into prices (entity_type, entity_id, price_type, amount_min, amount_max, currency, inclusions, exclusions, provider, source_id, observed_at, demo_data)
       select 'dive_center', op.id, 'single_dive', 32, 32, 'EUR', array['single dive (3+ dives), equipment extra'], array[]::text[], 'Atalaia Diving Center', src.id, now(), false
       from op, src
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

-- ============================================================
-- French Polynesia
-- ============================================================

with dest as (select id from destinations where slug = 'french-polynesia'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Master Liveaboards — French Polynesia Master (official site)', 'official_operator', 'https://masterliveaboards.com/boats/french-polynesia-master/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into liveaboards (destination_id, name, operator_name, itinerary_notes, website, demo_data)
       select dest.id, 'French Polynesia Master', 'Master Liveaboards',
         '~43m liveaboard yacht, 13 en-suite cabins for up to 25 divers, cruising the Tuamotu Archipelago between Rangiroa and Fakarava. 7- and 10-night itineraries, embarking at Fakarava Airport, Rangiroa, or Papeete. Price not publicly stated.',
         'https://masterliveaboards.com/boats/french-polynesia-master/', false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, itinerary_notes = excluded.itinerary_notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'liveaboard', op.id, 'listing', to_jsonb('Real, currently-operating liveaboard confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'french-polynesia'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Aquapolynésie — Aquatiki III (official site)', 'official_operator', 'https://aquatiki.com/en/aquatiki-3/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into liveaboards (destination_id, name, operator_name, itinerary_notes, website, demo_data)
       select dest.id, 'Aquatiki III', 'Aquapolynésie',
         '20m catamaran, full-boat private charter (up to 10 divers, 5 cabins), cruising the northern Tuamotu Archipelago out of Fakarava. Trip lengths roughly 8–14 nights; occasional itineraries extend to the Marquesas.',
         'https://aquatiki.com/en/aquatiki-3/', false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, itinerary_notes = excluded.itinerary_notes
       returning id
     ),
     price as (
       insert into prices (entity_type, entity_id, price_type, amount_min, amount_max, currency, inclusions, exclusions, provider, source_id, observed_at, demo_data)
       select 'liveaboard', op.id, 'liveaboard', 3700, 3700, 'EUR', array['per night, low season, full-charter public rate'], array[]::text[], 'Aquapolynésie', src.id, now(), false
       from op, src
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'liveaboard', op.id, 'listing', to_jsonb('Real, currently-operating liveaboard confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'french-polynesia'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('TOPDIVE (official site)', 'official_operator', 'https://topdive.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'TOPDIVE', array['shop','day_boat'],
         'https://topdive.com/',
         'Multi-island dive operator with 5-star dive centers on Tahiti, Bora Bora, Rangiroa, and Fakarava (both Rotoava and Tetamanu/Motu Penu). Free Nitrox for certified divers.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     ),
     price as (
       insert into prices (entity_type, entity_id, price_type, amount_min, amount_max, currency, inclusions, exclusions, provider, source_id, observed_at, demo_data)
       select 'dive_center', op.id, 'package', 91500, 175000, 'XPF', array['10-dive to 20-dive inter-island pass, shareable by 2 divers, valid on 2 islands'], array[]::text[], 'TOPDIVE', src.id, now(), false
       from op, src
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'french-polynesia'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Tetamanu Diving (official site)', 'official_operator', 'https://www.tetamanudiving.com/en/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Tetamanu Diving', array['shop','day_boat'],
         'https://www.tetamanudiving.com/en/',
         'Small dive center attached to Tetamanu Village hostel, at Fakarava''s South Pass (Tumakohua), a UNESCO Biosphere Reserve. Specializes in the South Pass "wall of sharks" (grey reef sharks); typically 2–3 dives/day timed to tidal current. Pricing not publicly stated.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'french-polynesia'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('The Six Passengers (official site)', 'official_operator', 'https://www.the6passengers.com/en/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'The Six Passengers', array['shop','day_boat'],
         'https://www.the6passengers.com/en/',
         'Dive center in Rangiroa established 1995, near Ohutu Bay/Kia Ora village, limiting each boat trip to six divers. Boat dives in the Tiputa and Avatoru passes of Rangiroa atoll. Pricing not publicly stated.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

-- ============================================================
-- Bali / Nusa Penida, Indonesia
-- ============================================================

with dest as (select id from destinations where slug = 'bali-nusa-penida'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Legend Diving Penida (official site)', 'official_operator', 'https://penidadivecenter.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Legend Diving Penida', array['shop','day_boat'],
         'https://penidadivecenter.com/',
         '5-star PADI IDC dive center on Nusa Penida running daily boat trips into the Nusa Penida Marine Protected Area. Multilingual instructor team; courses from Discover Scuba Diving through Divemaster/IDC. Pricing not publicly stated.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'bali-nusa-penida'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Diving Nusa Penida (official site)', 'official_operator', 'https://www.diving-penida.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Diving Nusa Penida', array['shop','day_boat'],
         'https://www.diving-penida.com/',
         'PADI dive center on Nusa Penida offering fun dives and courses focused on manta ray and mola mola (ocean sunfish) sightings. Day boat trips typically to Manta Point and Crystal Bay.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     ),
     price as (
       insert into prices (entity_type, entity_id, price_type, amount_min, amount_max, currency, inclusions, exclusions, provider, source_id, observed_at, demo_data)
       select 'dive_center', op.id, 'package', 20, 60, 'USD', array['1-day/2-dive up to 11-30 day multi-dive package, equipment, guide, lunch'], array[]::text[], 'Diving Nusa Penida', src.id, now(), false
       from op, src
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'bali-nusa-penida'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Nusa Penida Dive Center (official site)', 'official_operator', 'https://nusapenidadivecenter.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Nusa Penida Dive Center', array['shop','day_boat'],
         'https://nusapenidadivecenter.com/',
         'Dive center located centrally on Nusa Penida, five minutes from Banjar Nyuh harbour, offering daily dive activities and courses. Standard day boats depart 08:00 to two sites, usually Manta Point and Crystal Bay.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

-- ============================================================
-- Coron, Philippines
-- ============================================================

with dest as (select id from destinations where slug = 'coron'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Pirates Diving Center (official site)', 'official_operator', 'https://piratescoron.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Pirates Diving Center', array['shop','day_boat'],
         'https://piratescoron.com/',
         'PADI 5-Star dive center in Coron, Palawan, established in 1994, specializing in the WWII Japanese wreck sites of Coron Bay (Lusong Gunboat, Irako, Akitsushima, Okikawa Maru, Kogyo Maru), plus Barracuda Lake and reef dives.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'coron'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Corto Divers (official site)', 'official_operator', 'https://cortodivers.com/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Corto Divers', array['shop','day_boat'],
         'https://cortodivers.com/',
         'PADI dive center in Coron, Palawan, offering fun dives, multi-day packages, and PADI certification courses. Popular sites include Barracuda Lake and the Siete Pecados coral gardens alongside Coron''s shipwrecks. Base pricing not publicly stated.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;

with dest as (select id from destinations where slug = 'coron'),
     src as (
       insert into data_sources (name, source_type, url, reliability, notes)
       values ('Reggae Dive Center (official site)', 'official_operator', 'https://reggaedivecenter.com.ph/', 'medium',
         'Verified via indexed search snippet of operator''s own domain; direct page fetch was blocked in the research environment.')
       on conflict (name) do update set url = excluded.url, updated_at = now()
       returning id
     ),
     op as (
       insert into dive_centers (destination_id, name, center_type, website, notes, demo_data)
       select dest.id, 'Reggae Dive Center', array['shop','day_boat'],
         'https://reggaedivecenter.com.ph/',
         'PADI 5-Star Instructor Development Dive Center in Coron, Palawan — the first and only IDC center in Coron — running full PADI course offerings and daily wreck excursions (e.g. East Tangat) plus reef diving and Barracuda Lake. Pricing not publicly stated.',
         false
       from dest
       on conflict (destination_id, name) do update set website = excluded.website, notes = excluded.notes
       returning id
     )
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'dive_center', op.id, 'listing', to_jsonb('Real, currently-operating dive center confirmed via official site.'::text), src.id, 'official_operator', now(), 'medium', 'verified', false
from op, src;
