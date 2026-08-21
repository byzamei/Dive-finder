-- DiveFinder — extends the marine_species vocabulary with 4 species that
-- were deliberately left OUT of the 2026-08-21 wildlife-linking pass
-- because they didn't match anything in the existing 12-species list
-- (see that file's header note on Azores' devil ray, Aliwal Shoal's
-- raggedtooth shark, and French Polynesia's great hammerhead — all
-- different species from anything DiveFinder tracked, so left unlinked
-- rather than mismapped). Generated 2026-08-22.
--
-- Coron was also reconsidered here and deliberately still gets NO species
-- link: multiple sources describe wreck-site marine life there as
-- "occasional reef shark", "the truly fortunate" seeing a turtle or manta
-- — incidental sightings, not a reliable destination characteristic, so
-- forcing a link would overstate the evidence.
--
-- New species, each confirmed via multiple independent sources:
--   - Mediterranean monk seal (Monachus monachus) — Madeira's Desertas
--     Islands are one of the species' last strongholds in Europe (fewer
--     than 25 individuals). Linked at destination level only: Doca Bay
--     itself has been closed to diving/snorkelling since 2019 to protect
--     the colony, and neither existing Madeira site (Garajau, Afonso
--     Cerqueira) is at the Desertas — no single confirmed site to link.
--   - Great hammerhead (Sphyrna mokarran) — French Polynesia's Tiputa
--     Pass (Rangiroa), Jan–March. Not the same species as the scalloped
--     hammerhead already in the vocabulary.
--   - Chilean / sicklefin devil ray (Mobula tarapacana) — Azores'
--     Princess Alice Bank, June–October. Not a manta ray (different
--     genus-level distinction already noted in the previous pass).
--   - Ragged-tooth shark (Carcharias taurus) — Aliwal Shoal's "Raggie
--     Cave" specifically, June–November; also creates that site (it
--     didn't exist yet).
--
-- Confidence 'medium', consistent with the rest of this data-population
-- pass (search-snippet sourcing, no live page fetch — see
-- docs/operators.md).
--
-- Idempotent: safe to re-run.

-- 1. Shared source row for this batch.
insert into data_sources (name, source_type, reliability, notes)
values ('Cross-referenced dive-travel guide / conservation-org species descriptions (multi-source)', 'editorial', 'medium',
  'Cross-referenced multiple independent dive-guide and conservation-organisation descriptions naming a specific species at a specific destination or site; no single live page fetch, per docs/operators.md sourcing caveat.')
on conflict (name) do update set notes = excluded.notes;

-- 2. New species.
insert into marine_species (slug, common_name, scientific_name, category)
values
  ('mediterranean-monk-seal', 'Mediterranean monk seal', 'Monachus monachus', 'mammal'),
  ('great-hammerhead', 'Great hammerhead', 'Sphyrna mokarran', 'shark'),
  ('chilean-devil-ray', 'Chilean devil ray', 'Mobula tarapacana', 'ray'),
  ('raggedtooth-shark', 'Ragged-tooth shark', 'Carcharias taurus', 'shark')
on conflict (slug) do update set common_name = excluded.common_name, scientific_name = excluded.scientific_name, category = excluded.category;

-- 3. New dive site: Raggie Cave, Aliwal Shoal.
insert into dive_sites (slug, destination_id, name, access_type, site_type, max_depth_m, status, demo_data)
select 'raggie-cave-aliwal-shoal', d.id, 'Raggie Cave', 'boat', array['reef']::text[], 18::numeric, 'published', false
from destinations d where d.slug = 'south-africa-aliwal-sodwana'
on conflict (slug) do update set max_depth_m = excluded.max_depth_m;

insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'site', site.id, 'site_description', jsonb_build_object('name', site.name),
  (select id from data_sources where name = 'Cross-referenced dive-travel guide / conservation-org species descriptions (multi-source)'),
  'editorial', now(), 'medium', 'verified', false
from dive_sites site
where site.slug = 'raggie-cave-aliwal-shoal'
and not exists (
  select 1 from data_claims c where c.entity_type = 'site' and c.entity_id = site.id and c.field_name = 'site_description'
);

-- 4. Destination ↔ species links.
insert into destination_species (destination_id, species_id, demo_data)
select d.id, s.id, false
from (values
  ('madeira', 'mediterranean-monk-seal'),
  ('french-polynesia', 'great-hammerhead'),
  ('azores', 'chilean-devil-ray'),
  ('south-africa-aliwal-sodwana', 'raggedtooth-shark')
) as v(dest_slug, species_slug)
join destinations d on d.slug = v.dest_slug
join marine_species s on s.slug = v.species_slug
on conflict (destination_id, species_id) do nothing;

-- 5. Site ↔ species links (monk seal deliberately NOT linked to a site — see header note).
insert into site_species (site_id, species_id, demo_data)
select site.id, s.id, false
from (values
  ('tiputa-pass-rangiroa', 'great-hammerhead'),
  ('princess-alice-bank-azores', 'chilean-devil-ray'),
  ('raggie-cave-aliwal-shoal', 'raggedtooth-shark')
) as v(site_slug, species_slug)
join dive_sites site on site.slug = v.site_slug
join marine_species s on s.slug = v.species_slug
on conflict (site_id, species_id) do nothing;

-- 6. Data claims for the destination-level links.
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'destination', d.id, 'species_presence:' || v.species_slug,
  jsonb_build_object('species', sp.common_name),
  (select id from data_sources where name = 'Cross-referenced dive-travel guide / conservation-org species descriptions (multi-source)'),
  'editorial', now(), 'medium', 'verified', false
from (values
  ('madeira', 'mediterranean-monk-seal'),
  ('french-polynesia', 'great-hammerhead'),
  ('azores', 'chilean-devil-ray'),
  ('south-africa-aliwal-sodwana', 'raggedtooth-shark')
) as v(dest_slug, species_slug)
join destinations d on d.slug = v.dest_slug
join marine_species sp on sp.slug = v.species_slug
where not exists (
  select 1 from data_claims c
  where c.entity_type = 'destination' and c.entity_id = d.id and c.field_name = 'species_presence:' || v.species_slug
);

-- 7. Data claims for the site-level links.
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'site', site.id, 'species_presence:' || v.species_slug,
  jsonb_build_object('species', sp.common_name),
  (select id from data_sources where name = 'Cross-referenced dive-travel guide / conservation-org species descriptions (multi-source)'),
  'editorial', now(), 'medium', 'verified', false
from (values
  ('tiputa-pass-rangiroa', 'great-hammerhead'),
  ('princess-alice-bank-azores', 'chilean-devil-ray'),
  ('raggie-cave-aliwal-shoal', 'raggedtooth-shark')
) as v(site_slug, species_slug)
join dive_sites site on site.slug = v.site_slug
join marine_species sp on sp.slug = v.species_slug
where not exists (
  select 1 from data_claims c
  where c.entity_type = 'site' and c.entity_id = site.id and c.field_name = 'species_presence:' || v.species_slug
);
