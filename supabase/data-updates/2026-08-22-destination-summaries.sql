-- DiveFinder — short factual summaries for all 20 real destinations.
-- Generated 2026-08-22. destinations.summary has been null for every real
-- destination since seed time (see supabase/seed/data.ts: "everything
-- else stays unset until an admin adds a sourced claim"), so every
-- destination page showed "No verified summary yet".
--
-- Method: 2-3 sentences per destination describing well-established
-- geography and diving character only — never a depth, temperature,
-- visibility, price, season, or wildlife-probability claim (per
-- docs/data-governance.md's rule for this exact field). Cross-referenced
-- against multiple independent dive-guide sources, several already used
-- earlier this session for dive_type_tags / real dive sites / wildlife
-- links, so most of this draws on material already verified via
-- WebSearch rather than fresh lookups. Confidence 'medium', consistent
-- with the rest of this data-population pass (search-snippet sourcing,
-- no live page fetch — see docs/operators.md).
--
-- Idempotent: safe to re-run.

with src as (
  insert into data_sources (name, source_type, reliability, notes)
  values ('Cross-referenced dive-travel guide destination overviews (multi-source)', 'editorial', 'medium',
    'Cross-referenced multiple independent dive-guide/tourism-board destination overviews; no single live page fetch, per docs/operators.md sourcing caveat.')
  on conflict (name) do update set notes = excluded.notes
  returning id
),
upd as (
  update destinations d set summary = v.summary
  from (values
    ('maldives', 'A chain of coral atolls in the Indian Ocean built around narrow channels (kandus) between reef systems, drawing divers for manta ray and shark encounters and warm water year-round. Most diving is done from liveaboards or day boats reaching outer-atoll reefs and channels.'),
    ('raja-ampat', 'At the heart of the Coral Triangle, Raja Ampat is widely cited as having the highest reef fish biodiversity recorded anywhere on Earth. Diving centers on reef walls and current-swept channels around Misool, Dampier Strait, and Waigeo, reached by liveaboard or resort-based day boats.'),
    ('komodo', 'Komodo National Park spans a chain of volcanic islands where cold, nutrient-rich upwellings meet warm currents, producing dense reef life alongside strong, unpredictable currents. Diving ranges from drift dives in narrow channels to macro and muck sites, typically by liveaboard or day boat from Labuan Bajo.'),
    ('malapascua', 'A small island off northern Cebu known worldwide as one of the few places divers can reliably encounter thresher sharks at a seamount cleaning station. The island also offers muck diving and reef sites, reached by short boat rides from local dive operators.'),
    ('galapagos', 'A remote volcanic archipelago in the Pacific where cold Humboldt and warm Panama currents converge, producing exceptional pelagic diving — large schools of hammerhead sharks and open-ocean encounters around Darwin and Wolf Islands. Diving here is liveaboard-only and considered advanced due to strong currents and cooler water.'),
    ('red-sea-egypt', 'Egypt''s Red Sea coast is known for clear, warm water, extensive coral reef walls, and some of the world''s most-dived wreck sites, including the SS Thistlegorm. Diving ranges from easy reef sites near Sharm el-Sheikh and Hurghada to more exposed, current-driven southern reefs reached by liveaboard.'),
    ('socorro', 'A remote volcanic island group in the eastern Pacific, reachable only by multi-day liveaboard, known for close encounters with giant oceanic manta rays and schooling hammerhead sharks in open water. Diving here is for experienced divers comfortable with strong current and blue-water conditions.'),
    ('cozumel', 'An island off Mexico''s Yucatán Peninsula known for some of the Caribbean''s clearest water and dramatic wall diving, where a steady current carries divers along reef formations like Palancar and Santa Rosa. Most diving is drift diving by boat from the island''s west coast.'),
    ('bonaire', 'A former Dutch Caribbean island built around a fringing reef that circles almost the entire coastline, making it one of the world''s best-known shore-diving destinations — divers can enter the water directly from the road at marked sites. The island''s marine park status has kept reefs notably healthy.'),
    ('sipadan', 'Malaysia''s only oceanic island, rising from a deep-water pinnacle just offshore of Borneo, protected as a marine sanctuary with a strict daily diver quota. It''s known for exceptionally large numbers of green and hawksbill turtles and dramatic wall diving that drops straight into open ocean.'),
    ('palau', 'A Micronesian archipelago known for dramatic wall diving, strong-current channels, and some of the Pacific''s most consistent shark and pelagic action, alongside WWII wreck sites. Most diving is by day boat from Koror, with several sites requiring drift-diving experience.'),
    ('fiji', 'An archipelago in the South Pacific known as the "Soft Coral Capital of the World" for the vivid coral growth fed by strong tidal currents through its channels. Diving ranges from soft-coral walls like the Great White Wall to a dedicated shark-diving reserve at Beqa Lagoon with regular bull shark encounters.'),
    ('great-barrier-reef', 'The world''s largest coral reef system, stretching over 2,300 km along Australia''s northeast coast. Diving ranges from easy inshore reef sites to remote outer Coral Sea atolls like Osprey Reef, reached by liveaboard, known for dramatic drop-offs and reliable shark sightings.'),
    ('mozambique', 'The Tofo area on Mozambique''s southern coast is known as one of the world''s most reliable places to encounter whale sharks and manta rays year-round at cleaning stations just offshore. Diving is boat-based from small operators along an otherwise undeveloped stretch of coastline.'),
    ('south-africa-aliwal-sodwana', 'Two of South Africa''s best-known reef systems: Aliwal Shoal, a rocky reef and wreck site off the KwaZulu-Natal coast, and Sodwana Bay, a series of shallow tropical reefs inside a marine protected area near the Mozambique border. Both are known for shark diversity and boat-launched diving through the surf.'),
    ('azores', 'A volcanic archipelago in the mid-Atlantic where deep-water seamounts attract open-ocean pelagics rarely seen from shore-based diving elsewhere, including manta rays, blue sharks, and seasonal whale sharks. Diving is boat-based, often to offshore banks like Princess Alice, and considered advanced due to open-ocean conditions.'),
    ('madeira', 'A volcanic Atlantic island known for clear water, dramatic underwater lava formations, and a small but growing wreck-diving scene, including a deliberately sunk former navy corvette. Diving is boat-based around the island''s marine reserves.'),
    ('french-polynesia', 'A vast Pacific territory of coral atolls, most famous for pass diving — drift dives through narrow atoll channels like Fakarava''s Tumakohua Pass and Rangiroa''s Tiputa Pass, where converging currents bring in large numbers of sharks. Diving is boat-based, typically from resorts on the main atolls.'),
    ('bali-nusa-penida', 'Bali combines easy shore diving at Tulamben, home to the popular USS Liberty wreck, with the more current-driven waters around Nusa Penida, known for mola mola (ocean sunfish) sightings and a resident manta ray population. Both areas are reachable by day trip from south Bali.'),
    ('coron', 'A wreck-diving destination in the Philippines'' Palawan province, built around a cluster of Japanese supply ships sunk in a single 1944 air raid and still resting largely intact in Coron Bay. Diving is boat-based from Coron town, with wrecks ranging from easy penetration dives to deeper, more technical sites.')
  ) as v(slug, summary)
  where d.slug = v.slug
  returning d.id
)
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'destination', upd.id, 'summary',
  jsonb_build_object('note', 'Destination overview summary, 2026-08-22 pass'),
  src.id, 'editorial', now(), 'medium', 'verified', false
from upd, src
where not exists (
  select 1 from data_claims c where c.entity_type = 'destination' and c.entity_id = upd.id and c.field_name = 'summary'
);
