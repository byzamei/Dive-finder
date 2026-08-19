-- DiveFinder — 0010: gear / Mask Finder.
--
-- Masks are matched against a FACE PROFILE that is computed entirely
-- on-device (browser-side face-landmark measurement) — this table never
-- stores anything about a user's face. `fit_face_width` / `fit_nose_bridge`
-- are qualitative buying-guide categories (never a guaranteed fit),
-- sourced like any other claim in the app — see docs/gear-mask-finder.md
-- and docs/data-governance.md.

create table if not exists masks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  brand text not null,
  lens_type text not null check (lens_type in ('single', 'dual', 'frameless')),
  volume_category text not null check (volume_category in ('low', 'medium', 'high')),
  fit_face_width text[] not null default '{}', -- narrow, medium, wide
  fit_nose_bridge text[] not null default '{}', -- narrow, medium, wide
  notes text,
  image_url text,
  demo_data boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_masks_status on masks(status);

drop trigger if exists trg_masks_updated_at on masks;
create trigger trg_masks_updated_at before update on masks
  for each row execute function set_updated_at();

alter table masks enable row level security;
drop policy if exists masks_public_read on masks;
create policy masks_public_read on masks for select using (true);
drop policy if exists masks_admin_write on masks;
create policy masks_admin_write on masks for all using (is_admin()) with check (is_admin());

-- Qualitative, on-device-derived mask-fit preference. NEVER coordinates,
-- NEVER an image — only category labels, and only ever written by the
-- profile's own owner (same RLS pattern as the rest of diver_profiles).
alter table diver_profiles add column if not exists mask_face_width text
  check (mask_face_width in ('narrow', 'medium', 'wide'));
alter table diver_profiles add column if not exists mask_nose_bridge text
  check (mask_nose_bridge in ('narrow', 'medium', 'wide'));
alter table diver_profiles add column if not exists mask_face_shape text
  check (mask_face_shape in ('long', 'oval', 'round'));
