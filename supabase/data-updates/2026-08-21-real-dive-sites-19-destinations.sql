-- DiveFinder — real, named dive sites for the 19 real destinations that
-- had zero (Fiji already got 3 in the earlier pass — see
-- 2026-08-21-bull-shark-fiji.sql / 2026-08-21-fiji-more-sites.sql).
-- Generated 2026-08-21.
--
-- Method: 2-3 well-documented, real, currently-operating named dive sites
-- per destination, cross-referenced across multiple independent dive-guide
-- / operator publications (PADI, Scuba Diving Magazine, ZuBlu,
-- Dive The World, Bluewater Dive Travel, Divernet, and similar dedicated
-- dive-guide sites) via search snippets — this research environment's
-- live page-fetch tool is blocked, per docs/operators.md, so confidence
-- is 'medium'. Depth and current figures are included ONLY where a
-- source stated a specific number for that exact site — left null
-- everywhere else rather than estimated or inferred from a sibling site.
-- No precise GPS coordinates are included for the same reason (a rough
-- destination-level coordinate already exists on the destination row;
-- site-level GPS to the metre was not reliably available from search
-- snippets, so it is left unset rather than guessed).
--
-- site_type uses the dive_sites vocabulary (reef, wreck, wall, drift,
-- muck, pelagic) — narrower than destinations.dive_type_tags, which also
-- allows shore/boat/liveaboard/macro/photo_friendly (those live on
-- access_type or the destination row instead).
--
-- Idempotent: safe to re-run.

with src as (
  insert into data_sources (name, source_type, reliability, notes)
  values ('Cross-referenced dive-travel guide and operator site descriptions (multi-source)', 'editorial', 'medium',
    'Cross-referenced multiple independent dive-guide/operator descriptions per named site; no single live page fetch, per docs/operators.md sourcing caveat.')
  on conflict (name) do update set notes = excluded.notes
  returning id
),
sites as (
  insert into dive_sites (
    slug, destination_id, name, access_type, site_type,
    min_depth_m, max_depth_m, typical_visibility_m_min, typical_visibility_m_max,
    typical_current, status, demo_data
  )
  select
    v.slug, d.id, v.name, v.access_type, v.site_type::text[],
    v.min_depth_m, v.max_depth_m, v.vis_min, v.vis_max, v.typical_current, 'published', false
  from (values
    -- Maldives
    ('maldives', 'fish-head-maldives', 'Fish Head (Mushimasmingili Thila)', 'boat', array['reef','wall','pelagic'], 15::numeric, 35::numeric, null::numeric, null::numeric, 'moderate'),
    ('maldives', 'manta-point-maldives', 'Manta Point (North Malé Atoll)', 'boat', array['reef','pelagic'], 15::numeric, 40::numeric, null::numeric, null::numeric, 'mild'),
    ('maldives', 'miyaru-kandu-maldives', 'Miyaru Kandu', 'boat', array['reef','drift','pelagic'], null::numeric, 30::numeric, null::numeric, null::numeric, 'strong'),
    -- Raja Ampat
    ('raja-ampat', 'cape-kri-raja-ampat', 'Cape Kri', 'boat', array['reef','pelagic'], null::numeric, null::numeric, null::numeric, null::numeric, 'moderate'),
    ('raja-ampat', 'blue-magic-raja-ampat', 'Blue Magic', 'boat', array['reef','wall','pelagic'], null::numeric, null::numeric, null::numeric, null::numeric, 'strong'),
    ('raja-ampat', 'manta-sandy-raja-ampat', 'Manta Sandy', 'boat', array['reef','pelagic'], null::numeric, 16::numeric, null::numeric, null::numeric, 'strong'),
    -- Komodo
    ('komodo', 'the-cauldron-komodo', 'The Cauldron (Shotgun)', 'boat', array['drift','pelagic'], 10::numeric, 28::numeric, null::numeric, null::numeric, 'strong'),
    ('komodo', 'batu-bolong-komodo', 'Batu Bolong', 'boat', array['reef','wall'], 12::numeric, 22::numeric, null::numeric, null::numeric, 'variable'),
    ('komodo', 'manta-alley-komodo', 'Manta Alley', 'liveaboard', array['reef','pelagic'], 23::numeric, 30::numeric, null::numeric, null::numeric, 'variable'),
    -- Malapascua
    ('malapascua', 'monad-shoal-malapascua', 'Monad Shoal', 'boat', array['reef','pelagic'], 15::numeric, 25::numeric, null::numeric, null::numeric, 'moderate'),
    ('malapascua', 'kimud-shoal-malapascua', 'Kimud Shoal', 'boat', array['reef','pelagic'], 12::numeric, 22::numeric, null::numeric, null::numeric, 'moderate'),
    -- Galápagos
    ('galapagos', 'darwins-arch-galapagos', 'Darwin''s Arch', 'liveaboard', array['wall','pelagic'], 15::numeric, 20::numeric, null::numeric, null::numeric, 'strong'),
    ('galapagos', 'wolf-island-galapagos', 'Wolf Island (Shark Bay)', 'liveaboard', array['wall','pelagic'], null::numeric, 23::numeric, null::numeric, null::numeric, 'strong'),
    -- Red Sea — Egypt
    ('red-sea-egypt', 'ss-thistlegorm-egypt', 'SS Thistlegorm', 'boat', array['wreck'], null::numeric, null::numeric, null::numeric, null::numeric, null),
    ('red-sea-egypt', 'ras-mohammed-egypt', 'Ras Mohammed National Park', 'boat', array['reef','wall'], null::numeric, null::numeric, null::numeric, null::numeric, null),
    ('red-sea-egypt', 'elphinstone-reef-egypt', 'Elphinstone Reef', 'boat', array['wall','drift','pelagic'], null::numeric, null::numeric, null::numeric, null::numeric, 'strong'),
    -- Socorro
    ('socorro', 'the-boiler-socorro', 'The Boiler (San Benedicto)', 'liveaboard', array['reef','pelagic'], 6::numeric, null::numeric, null::numeric, null::numeric, 'moderate'),
    ('socorro', 'roca-partida-socorro', 'Roca Partida', 'liveaboard', array['wall','pelagic'], 18::numeric, 60::numeric, null::numeric, null::numeric, 'strong'),
    ('socorro', 'cabo-pearce-socorro', 'Cabo Pearce', 'liveaboard', array['reef','pelagic'], null::numeric, null::numeric, null::numeric, null::numeric, 'moderate'),
    -- Cozumel
    ('cozumel', 'palancar-reef-cozumel', 'Palancar Reef', 'boat', array['wall','drift'], 8::numeric, null::numeric, null::numeric, null::numeric, 'moderate'),
    ('cozumel', 'santa-rosa-wall-cozumel', 'Santa Rosa Wall', 'boat', array['wall','drift'], 11::numeric, null::numeric, null::numeric, null::numeric, 'moderate'),
    -- Bonaire
    ('bonaire', '1000-steps-bonaire', '1000 Steps', 'shore', array['reef'], null::numeric, 40::numeric, null::numeric, null::numeric, null),
    ('bonaire', 'salt-pier-bonaire', 'Salt Pier', 'shore', array['wreck','reef'], 6::numeric, 17::numeric, null::numeric, null::numeric, null),
    -- Sipadan
    ('sipadan', 'barracuda-point-sipadan', 'Barracuda Point', 'boat', array['wall','drift','pelagic'], null::numeric, null::numeric, 15::numeric, 30::numeric, 'variable'),
    ('sipadan', 'turtle-patch-sipadan', 'Turtle Patch', 'boat', array['reef'], null::numeric, null::numeric, null::numeric, null::numeric, 'mild'),
    -- Palau
    ('palau', 'blue-corner-palau', 'Blue Corner', 'boat', array['wall','drift','pelagic'], 8::numeric, 30::numeric, null::numeric, null::numeric, 'strong'),
    ('palau', 'german-channel-palau', 'German Channel', 'boat', array['reef','pelagic'], null::numeric, 15::numeric, null::numeric, null::numeric, 'moderate'),
    ('palau', 'peleliu-wall-palau', 'Peleliu Wall', 'boat', array['wall','drift'], null::numeric, null::numeric, null::numeric, null::numeric, 'strong'),
    -- Great Barrier Reef
    ('great-barrier-reef', 'osprey-reef-coral-sea', 'Osprey Reef (North Horn)', 'liveaboard', array['wall','pelagic'], 18::numeric, 20::numeric, null::numeric, null::numeric, 'moderate'),
    ('great-barrier-reef', 'cod-hole-ribbon-reefs', 'Cod Hole (Ribbon Reef No. 10)', 'boat', array['reef'], 18::numeric, 32::numeric, 25::numeric, 35::numeric, 'mild'),
    -- Mozambique
    ('mozambique', 'manta-reef-tofo-mozambique', 'Manta Reef (Tofo)', 'boat', array['reef','pelagic'], null::numeric, 26::numeric, null::numeric, null::numeric, 'moderate'),
    ('mozambique', 'the-office-tofo-mozambique', 'The Office (Tofo)', 'boat', array['reef'], null::numeric, null::numeric, null::numeric, null::numeric, null),
    -- South Africa — Aliwal/Sodwana
    ('south-africa-aliwal-sodwana', 'ss-nebo-aliwal-shoal', 'SS Nebo', 'boat', array['wreck'], null::numeric, 27::numeric, null::numeric, null::numeric, null),
    ('south-africa-aliwal-sodwana', 'two-mile-reef-sodwana', 'Two Mile Reef (Sodwana Bay)', 'boat', array['reef','drift'], 9::numeric, 35::numeric, null::numeric, null::numeric, 'moderate'),
    ('south-africa-aliwal-sodwana', 'seven-mile-reef-sodwana', 'Seven Mile Reef (Sodwana Bay)', 'boat', array['wall'], 16::numeric, 24::numeric, null::numeric, null::numeric, 'moderate'),
    -- Azores
    ('azores', 'princess-alice-bank-azores', 'Princess Alice Bank', 'boat', array['reef','pelagic'], 29::numeric, 40::numeric, null::numeric, null::numeric, 'strong'),
    -- Madeira
    ('madeira', 'garajau-marine-reserve-madeira', 'Garajau Marine Reserve', 'boat', array['reef','wall'], null::numeric, null::numeric, null::numeric, null::numeric, null),
    ('madeira', 'afonso-cerqueira-madeira', 'Afonso Cerqueira Wreck', 'boat', array['wreck'], 12::numeric, 30::numeric, null::numeric, null::numeric, null),
    -- French Polynesia
    ('french-polynesia', 'tiputa-pass-rangiroa', 'Tiputa Pass (Rangiroa)', 'boat', array['drift','pelagic'], null::numeric, null::numeric, null::numeric, null::numeric, 'strong'),
    ('french-polynesia', 'tumakohua-pass-fakarava', 'Tumakohua Pass (Fakarava South)', 'boat', array['drift','pelagic'], null::numeric, null::numeric, null::numeric, null::numeric, 'strong'),
    -- Bali / Nusa Penida
    ('bali-nusa-penida', 'crystal-bay-nusa-penida', 'Crystal Bay', 'boat', array['reef','drift'], 5::numeric, 30::numeric, null::numeric, null::numeric, 'moderate'),
    ('bali-nusa-penida', 'manta-point-nusa-penida', 'Manta Point (Nusa Penida)', 'boat', array['reef','pelagic'], null::numeric, null::numeric, null::numeric, null::numeric, 'moderate'),
    ('bali-nusa-penida', 'uss-liberty-tulamben', 'USS Liberty Wreck (Tulamben)', 'shore', array['wreck'], null::numeric, null::numeric, null::numeric, null::numeric, 'none'),
    -- Coron
    ('coron', 'irako-wreck-coron', 'Irako Wreck', 'boat', array['wreck'], null::numeric, null::numeric, null::numeric, null::numeric, null),
    ('coron', 'kyokuzan-maru-coron', 'Kyokuzan Maru', 'boat', array['wreck'], 22::numeric, 39::numeric, null::numeric, null::numeric, null)
  ) as v(dest_slug, slug, name, access_type, site_type, min_depth_m, max_depth_m, vis_min, vis_max, typical_current)
  join destinations d on d.slug = v.dest_slug
  on conflict (slug) do update set
    access_type = excluded.access_type,
    site_type = excluded.site_type,
    min_depth_m = excluded.min_depth_m,
    max_depth_m = excluded.max_depth_m,
    typical_visibility_m_min = excluded.typical_visibility_m_min,
    typical_visibility_m_max = excluded.typical_visibility_m_max,
    typical_current = excluded.typical_current
  returning id, slug, name
)
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'site', sites.id, 'site_description', jsonb_build_object('name', sites.name),
  src.id, 'editorial', now(), 'medium', 'verified', false
from sites
cross join src
where not exists (
  select 1 from data_claims c where c.entity_type = 'site' and c.entity_id = sites.id and c.field_name = 'site_description'
);
