-- DiveFinder — real destination↔species and site↔species links for the
-- 19 real destinations that had none (Fiji's bull shark link already
-- exists — see 2026-08-21-bull-shark-fiji.sql). Generated 2026-08-21.
--
-- IMPORTANT: run 2026-08-21-real-dive-sites-19-destinations.sql BEFORE
-- this file — the site_species inserts below look up dive_sites by slug,
-- which only exist after that script runs.
--
-- Method: only linked when a species from the existing 12-species
-- vocabulary (marine_species) was directly and specifically documented
-- for that destination/site across multiple independent dive-guide
-- sources — never inferred from a "similar" or same-genus species. Several
-- well-known but off-vocabulary species were deliberately left out rather
-- than mapped to the closest existing entry (e.g. Azores' giant mobula/
-- devil ray is NOT the same species as our manta rays and is not linked;
-- Aliwal Shoal's raggedtooth/grey nurse shark and French Polynesia's
-- great hammerhead are both different species from anything in our
-- current vocabulary and are also left unlinked). Confidence 'medium',
-- consistent with the rest of this data-population pass (search-snippet
-- sourcing, no live page fetch — see docs/operators.md).
--
-- Structured as five independent statements (not one giant CTE chain) so
-- each is simple to read and none risk an accidental cross-join blowup —
-- every entity here is looked up directly by slug, not passed between
-- statements via RETURNING.
--
-- Idempotent: safe to re-run.

-- 1. Shared source row for this batch.
insert into data_sources (name, source_type, reliability, notes)
values ('Cross-referenced dive-travel guide species-presence descriptions (multi-source)', 'editorial', 'medium',
  'Cross-referenced multiple independent dive-guide/operator descriptions naming a specific species at a specific destination or site; no single live page fetch, per docs/operators.md sourcing caveat.')
on conflict (name) do update set notes = excluded.notes;

-- 2. Destination ↔ species links.
insert into destination_species (destination_id, species_id, demo_data)
select d.id, s.id, false
from (values
  ('maldives', 'reef-manta-ray'), ('maldives', 'scalloped-hammerhead'), ('maldives', 'whale-shark'), ('maldives', 'sea-turtle'),
  ('raja-ampat', 'reef-manta-ray'),
  ('komodo', 'reef-manta-ray'),
  ('malapascua', 'tiger-shark'), ('malapascua', 'thresher-shark'),
  ('galapagos', 'scalloped-hammerhead'), ('galapagos', 'whale-shark'),
  ('red-sea-egypt', 'oceanic-whitetip'), ('red-sea-egypt', 'scalloped-hammerhead'),
  ('socorro', 'oceanic-manta-ray'), ('socorro', 'scalloped-hammerhead'), ('socorro', 'whale-shark'), ('socorro', 'humpback-whale'),
  ('cozumel', 'sea-turtle'),
  ('bonaire', 'sea-turtle'),
  ('sipadan', 'scalloped-hammerhead'), ('sipadan', 'sea-turtle'),
  ('palau', 'reef-manta-ray'),
  ('great-barrier-reef', 'reef-manta-ray'),
  ('mozambique', 'reef-manta-ray'), ('mozambique', 'whale-shark'), ('mozambique', 'sea-turtle'),
  ('south-africa-aliwal-sodwana', 'sea-turtle'),
  ('azores', 'oceanic-manta-ray'), ('azores', 'whale-shark'),
  ('bali-nusa-penida', 'mola-mola'), ('bali-nusa-penida', 'reef-manta-ray')
) as v(dest_slug, species_slug)
join destinations d on d.slug = v.dest_slug
join marine_species s on s.slug = v.species_slug
on conflict (destination_id, species_id) do nothing;

-- 3. Site ↔ species links (requires dive_sites from the sites script above).
insert into site_species (site_id, species_id, demo_data)
select site.id, s.id, false
from (values
  ('manta-point-maldives', 'reef-manta-ray'),
  ('miyaru-kandu-maldives', 'scalloped-hammerhead'),
  ('manta-sandy-raja-ampat', 'reef-manta-ray'),
  ('blue-magic-raja-ampat', 'reef-manta-ray'),
  ('manta-alley-komodo', 'reef-manta-ray'),
  ('monad-shoal-malapascua', 'tiger-shark'),
  ('kimud-shoal-malapascua', 'thresher-shark'),
  ('darwins-arch-galapagos', 'scalloped-hammerhead'),
  ('wolf-island-galapagos', 'scalloped-hammerhead'),
  ('wolf-island-galapagos', 'whale-shark'),
  ('elphinstone-reef-egypt', 'oceanic-whitetip'),
  ('the-boiler-socorro', 'oceanic-manta-ray'),
  ('roca-partida-socorro', 'scalloped-hammerhead'),
  ('roca-partida-socorro', 'whale-shark'),
  ('roca-partida-socorro', 'humpback-whale'),
  ('cabo-pearce-socorro', 'oceanic-manta-ray'),
  ('cabo-pearce-socorro', 'scalloped-hammerhead'),
  ('palancar-reef-cozumel', 'sea-turtle'),
  ('santa-rosa-wall-cozumel', 'sea-turtle'),
  ('1000-steps-bonaire', 'sea-turtle'),
  ('turtle-patch-sipadan', 'sea-turtle'),
  ('german-channel-palau', 'reef-manta-ray'),
  ('manta-reef-tofo-mozambique', 'reef-manta-ray'),
  ('the-office-tofo-mozambique', 'sea-turtle'),
  ('seven-mile-reef-sodwana', 'sea-turtle'),
  ('princess-alice-bank-azores', 'oceanic-manta-ray'),
  ('princess-alice-bank-azores', 'whale-shark'),
  ('crystal-bay-nusa-penida', 'mola-mola'),
  ('manta-point-nusa-penida', 'reef-manta-ray')
) as v(site_slug, species_slug)
join dive_sites site on site.slug = v.site_slug
join marine_species s on s.slug = v.species_slug
on conflict (site_id, species_id) do nothing;

-- 4. Data claims for the destination-level links (one row per destination+species, skipped if already claimed).
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'destination', d.id, 'species_presence:' || v.species_slug,
  jsonb_build_object('species', sp.common_name),
  (select id from data_sources where name = 'Cross-referenced dive-travel guide species-presence descriptions (multi-source)'),
  'editorial', now(), 'medium', 'verified', false
from (values
  ('maldives', 'reef-manta-ray'), ('maldives', 'scalloped-hammerhead'), ('maldives', 'whale-shark'), ('maldives', 'sea-turtle'),
  ('raja-ampat', 'reef-manta-ray'),
  ('komodo', 'reef-manta-ray'),
  ('malapascua', 'tiger-shark'), ('malapascua', 'thresher-shark'),
  ('galapagos', 'scalloped-hammerhead'), ('galapagos', 'whale-shark'),
  ('red-sea-egypt', 'oceanic-whitetip'), ('red-sea-egypt', 'scalloped-hammerhead'),
  ('socorro', 'oceanic-manta-ray'), ('socorro', 'scalloped-hammerhead'), ('socorro', 'whale-shark'), ('socorro', 'humpback-whale'),
  ('cozumel', 'sea-turtle'),
  ('bonaire', 'sea-turtle'),
  ('sipadan', 'scalloped-hammerhead'), ('sipadan', 'sea-turtle'),
  ('palau', 'reef-manta-ray'),
  ('great-barrier-reef', 'reef-manta-ray'),
  ('mozambique', 'reef-manta-ray'), ('mozambique', 'whale-shark'), ('mozambique', 'sea-turtle'),
  ('south-africa-aliwal-sodwana', 'sea-turtle'),
  ('azores', 'oceanic-manta-ray'), ('azores', 'whale-shark'),
  ('bali-nusa-penida', 'mola-mola'), ('bali-nusa-penida', 'reef-manta-ray')
) as v(dest_slug, species_slug)
join destinations d on d.slug = v.dest_slug
join marine_species sp on sp.slug = v.species_slug
where not exists (
  select 1 from data_claims c
  where c.entity_type = 'destination' and c.entity_id = d.id and c.field_name = 'species_presence:' || v.species_slug
);

-- 5. Data claims for the site-level links.
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'site', site.id, 'species_presence:' || v.species_slug,
  jsonb_build_object('species', sp.common_name),
  (select id from data_sources where name = 'Cross-referenced dive-travel guide species-presence descriptions (multi-source)'),
  'editorial', now(), 'medium', 'verified', false
from (values
  ('manta-point-maldives', 'reef-manta-ray'),
  ('miyaru-kandu-maldives', 'scalloped-hammerhead'),
  ('manta-sandy-raja-ampat', 'reef-manta-ray'),
  ('blue-magic-raja-ampat', 'reef-manta-ray'),
  ('manta-alley-komodo', 'reef-manta-ray'),
  ('monad-shoal-malapascua', 'tiger-shark'),
  ('kimud-shoal-malapascua', 'thresher-shark'),
  ('darwins-arch-galapagos', 'scalloped-hammerhead'),
  ('wolf-island-galapagos', 'scalloped-hammerhead'),
  ('wolf-island-galapagos', 'whale-shark'),
  ('elphinstone-reef-egypt', 'oceanic-whitetip'),
  ('the-boiler-socorro', 'oceanic-manta-ray'),
  ('roca-partida-socorro', 'scalloped-hammerhead'),
  ('roca-partida-socorro', 'whale-shark'),
  ('roca-partida-socorro', 'humpback-whale'),
  ('cabo-pearce-socorro', 'oceanic-manta-ray'),
  ('cabo-pearce-socorro', 'scalloped-hammerhead'),
  ('palancar-reef-cozumel', 'sea-turtle'),
  ('santa-rosa-wall-cozumel', 'sea-turtle'),
  ('1000-steps-bonaire', 'sea-turtle'),
  ('turtle-patch-sipadan', 'sea-turtle'),
  ('german-channel-palau', 'reef-manta-ray'),
  ('manta-reef-tofo-mozambique', 'reef-manta-ray'),
  ('the-office-tofo-mozambique', 'sea-turtle'),
  ('seven-mile-reef-sodwana', 'sea-turtle'),
  ('princess-alice-bank-azores', 'oceanic-manta-ray'),
  ('princess-alice-bank-azores', 'whale-shark'),
  ('crystal-bay-nusa-penida', 'mola-mola'),
  ('manta-point-nusa-penida', 'reef-manta-ray')
) as v(site_slug, species_slug)
join dive_sites site on site.slug = v.site_slug
join marine_species sp on sp.slug = v.species_slug
where not exists (
  select 1 from data_claims c
  where c.entity_type = 'site' and c.entity_id = site.id and c.field_name = 'species_presence:' || v.species_slug
);
