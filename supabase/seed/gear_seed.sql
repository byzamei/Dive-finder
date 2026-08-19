-- DiveFinder — Gear / Mask Finder seed data.
-- Run AFTER supabase/all_migrations.sql (needs the `masks` table from
-- migration 0010) and after supabase/seed/seed.sql (reuses the same
-- pattern). Safe to re-run — ON CONFLICT DO NOTHING on slug.
--
-- Sourcing note: lens type and volume category are standard, published
-- product-design facts. Face-width / nose-bridge fit guidance below
-- reflects general consensus across public dive-gear buying guides
-- (e.g. DIVEIN's Scuba Mask Buyer's Guide) — NOT precise manufacturer
-- fit data, which is not publicly available in structured form. This is
-- why every mask is shown with "possible/good" suitability, never a
-- guaranteed fit — see docs/gear-mask-finder.md. Always try a mask before
-- buying.

insert into data_sources (name, source_type, url, reliability, notes)
values (
  'Public dive-gear buying guides (aggregated)',
  'editorial',
  'https://www.divein.com/articles/buyers-guide-scuba-masks/',
  'medium',
  'General face-shape fit guidance aggregated from public scuba mask buying guides. Not manufacturer lab-measured fit data — always try a mask before buying.'
)
on conflict do nothing;

insert into masks (slug, name, brand, lens_type, volume_category, fit_face_width, fit_nose_bridge, notes, status, demo_data) values
  ('cressi-f1', 'F1', 'Cressi', 'frameless', 'low',
   array['narrow','medium'], array['narrow','medium'],
   'Frameless low-volume design commonly recommended for narrow-to-medium, smaller faces.',
   'published', false),
  ('mares-x-vision-ultra-liquidskin', 'X-Vision Ultra Liquidskin', 'Mares', 'dual', 'low',
   array['narrow','medium'], array['narrow','medium'],
   'Low-volume dual-lens mask, liquid-silicone skirt, often cited as a good fit for narrower faces.',
   'published', false),
  ('atomic-venom-frameless', 'Venom Frameless', 'Atomic Aquatics', 'frameless', 'low',
   array['narrow','medium'], array['narrow'],
   'Frameless single-lens design with a wide field of view, generally suited to narrower face widths.',
   'published', false),
  ('scubapro-synergy-twin', 'Synergy Twin', 'Scubapro', 'dual', 'medium',
   array['medium','wide'], array['medium','wide'],
   'Dual-lens medium-volume mask commonly cited as fitting a broad range of face widths, including wider faces.',
   'published', false),
  ('tusa-freedom-hd', 'Freedom HD (Ceos)', 'TUSA', 'dual', 'medium',
   array['narrow','medium','wide'], array['narrow','medium','wide'],
   'Dual-lens mask frequently recommended across a wide range of face shapes and sizes, including smaller/rounder faces.',
   'published', false)
on conflict (slug) do nothing;

-- One provenance claim per mask, pointing at the aggregated source above.
insert into data_claims (entity_type, entity_id, field_name, value_json, source_id, source_type, observed_at, verified_at, confidence, review_status)
select 'mask', m.id, 'fit_guidance', to_jsonb(m.notes),
       (select id from data_sources where name = 'Public dive-gear buying guides (aggregated)'),
       'editorial', now(), now(), 'low', 'verified'
from masks m
where m.demo_data = false
  and not exists (
    select 1 from data_claims c where c.entity_type = 'mask' and c.entity_id = m.id and c.field_name = 'fit_guidance'
  );
