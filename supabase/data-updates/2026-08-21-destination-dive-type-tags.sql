-- DiveFinder — dive_type_tags for the 20 real destinations.
-- Generated 2026-08-21. dive_type_tags has existed on destinations since
-- 0002_geo_reference.sql but was only ever populated for the 3 fabricated
-- Demo Island destinations at seed time (see supabase/seed/data.ts's
-- comment: "everything else stays unset until an admin adds a sourced
-- claim") — so the "Conditions" filter on Explore/Results was a no-op
-- against every real destination.
--
-- Method: for each destination, cross-referenced multiple independent
-- dive-travel publications (PADI, Scuba Diving Magazine, ZuBlu,
-- Dive The World, Bluewater Dive Travel, Girls That Scuba, DiveJourney,
-- and similar dedicated dive-guide sites) via search snippets — this
-- research environment's live page-fetch tool is blocked, per the
-- sourcing caveat in docs/operators.md, so confidence is 'medium', same
-- as the rest of this data-population pass. Tags are deliberately
-- conservative: only included when the characteristic was repeated
-- consistently across independent sources for that destination (e.g. a
-- single passing mention of "reef" wasn't enough to tag "reef" if the
-- destination is overwhelmingly described as wreck diving). Tags use the
-- existing vocabulary from the destinations.dive_type_tags column
-- comment: shore, boat, liveaboard, resort, reef, wreck, wall, drift,
-- muck, pelagic, macro, photo_friendly.
--
-- Idempotent: safe to re-run.

with src as (
  insert into data_sources (name, source_type, reliability, notes)
  values ('Cross-referenced dive-travel guide publications (PADI, Scuba Diving Magazine, ZuBlu, Dive The World, Bluewater Dive Travel, DiveJourney, and similar)', 'editorial', 'medium',
    'Dive-type tags reflect characteristics repeated consistently across multiple independent dive-travel publications for each destination, gathered via search snippets rather than a single live page fetch (see docs/operators.md sourcing caveat).')
  on conflict (name) do update set notes = excluded.notes
  returning id
),
upd as (
  update destinations d set dive_type_tags = v.tags
  from (values
    ('maldives', array['reef','drift','pelagic','boat','liveaboard']::text[]),
    ('raja-ampat', array['reef','macro','wall','liveaboard','boat','photo_friendly']::text[]),
    ('komodo', array['reef','drift','muck','pelagic','boat','liveaboard']::text[]),
    ('malapascua', array['reef','muck','pelagic','macro','boat']::text[]),
    ('galapagos', array['pelagic','drift','liveaboard','boat']::text[]),
    ('red-sea-egypt', array['wreck','reef','wall','liveaboard','boat']::text[]),
    ('socorro', array['pelagic','liveaboard','boat','drift']::text[]),
    ('cozumel', array['reef','wall','drift','boat']::text[]),
    ('bonaire', array['shore','reef','macro','photo_friendly','wall']::text[]),
    ('sipadan', array['wall','drift','pelagic','reef','boat']::text[]),
    ('palau', array['wall','drift','pelagic','reef','wreck','liveaboard','boat']::text[]),
    ('fiji', array['reef','pelagic','wall','boat']::text[]),
    ('great-barrier-reef', array['reef','wall','pelagic','liveaboard','boat','drift']::text[]),
    ('mozambique', array['pelagic','reef','boat']::text[]),
    ('south-africa-aliwal-sodwana', array['reef','wreck','pelagic','boat']::text[]),
    ('azores', array['pelagic','boat']::text[]),
    ('madeira', array['reef','wall','wreck','photo_friendly','boat']::text[]),
    ('french-polynesia', array['drift','pelagic','reef','boat']::text[]),
    ('bali-nusa-penida', array['wreck','muck','macro','shore','pelagic','drift']::text[]),
    ('coron', array['wreck','boat']::text[])
  ) as v(slug, tags)
  where d.slug = v.slug
  returning d.id, d.dive_type_tags
)
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, confidence, review_status, demo_data)
select 'destination', upd.id, 'dive_type_tags',
  to_jsonb(upd.dive_type_tags),
  src.id, 'editorial', now(), 'medium', 'verified', false
from upd, src
where not exists (
  select 1 from data_claims c
  where c.entity_type = 'destination' and c.entity_id = upd.id and c.field_name = 'dive_type_tags'
);
