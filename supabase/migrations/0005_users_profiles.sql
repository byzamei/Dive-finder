-- DiveFinder — 0005: user profiles and diver profiles.
-- `profiles` mirrors auth.users (1:1) and carries the app role.
-- `diver_profiles` carries the diving-specific fields used by scoring.

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create table if not exists diver_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  certification_agency_id uuid references certification_agencies(id),
  certification_id uuid references certifications(id),
  number_of_dives_bucket text check (
    number_of_dives_bucket in ('0-9', '10-24', '25-49', '50-99', '100-249', '250+')
  ),
  training_max_depth_m numeric,
  nitrox_certified boolean not null default false,
  current_experience text check (current_experience in ('none', 'some', 'comfortable', 'expert')),
  drift_experience boolean not null default false,
  wreck_experience boolean not null default false,
  night_experience boolean not null default false,
  dry_suit_experience boolean not null default false,
  -- Declared self-reported experience ONLY. Never used as an authorization
  -- check for cave sites — see docs/scoring.md "Safety filters".
  cave_experience_declared boolean not null default false,
  species_preferences uuid[] not null default '{}', -- references marine_species(id), enforced in app layer
  preferred_water_temp_min_c numeric,
  preferred_water_temp_max_c numeric,
  -- reef, wreck, wall, drift, muck, pelagic, shore, boat, liveaboard, macro, photo_friendly
  preferred_dive_types text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_certifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  certification_id uuid not null references certifications(id),
  cert_number text,
  cert_date date,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_certifications_user on user_certifications(user_id);

drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

drop trigger if exists trg_diver_profiles_updated_at on diver_profiles;
create trigger trg_diver_profiles_updated_at before update on diver_profiles
  for each row execute function set_updated_at();
