-- DiveFinder — 0012: personal dive logbook.
-- A private, per-diver log of dives — distinct from every other table in
-- this schema, which is either public reference content (destinations,
-- sites, species) or a sourced/moderated claim. Nothing here is ever
-- treated as verified data about a destination or site; it's the diver's
-- own record.

create table if not exists dive_log_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  dive_date date not null,
  -- Either linked to a catalog site, or a free-text name for a spot not in
  -- DiveFinder yet — never both required, never invented if left blank.
  site_id uuid references dive_sites(id) on delete set null,
  site_name text,
  destination_id uuid references destinations(id) on delete set null,
  duration_minutes int,
  max_depth_m numeric,
  avg_depth_m numeric,
  water_temp_c numeric,
  visibility_bucket text,
  current_bucket text,
  buddy_name text,
  gas_type text check (gas_type in ('air', 'nitrox', 'other')),
  nitrox_percentage numeric,
  species_observed uuid[] not null default '{}',
  rating int check (rating between 1 and 5),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_dive_log_entries_user on dive_log_entries(user_id, dive_date desc);

alter table dive_log_entries enable row level security;

drop policy if exists dive_log_entries_owner_all on dive_log_entries;
create policy dive_log_entries_owner_all on dive_log_entries
  for all using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid());

drop trigger if exists trg_dive_log_entries_updated_at on dive_log_entries;
create trigger trg_dive_log_entries_updated_at before update on dive_log_entries
  for each row execute function set_updated_at();
