-- DiveFinder — ALL migrations combined into one file, in order.
-- Generated for convenience (paste-and-run once in the Supabase SQL Editor).
-- Source of truth stays supabase/migrations/0001..0020 — regenerate this file
-- with: cat supabase/migrations/*.sql > supabase/all_migrations.sql

-- DiveFinder — 0001: extensions
-- pgcrypto: gen_random_uuid() for primary keys.
-- postgis: geography columns + spatial queries (nearest destination, map bounding boxes).
-- On self-hosted Postgres without PostGIS available, comment out the postgis line and
-- the `geom geography(Point,4326)` columns below still create fine as long as the
-- postgis type is not referenced — see docs/data-model.md for the non-PostGIS fallback
-- (latitude/longitude numeric columns are always present and are enough to run the app).
create extension if not exists pgcrypto;
create extension if not exists postgis;
-- DiveFinder — 0002: geographic reference data (countries, regions) and core
-- destination / dive site entities.

create table if not exists countries (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  iso_code char(2) unique,
  continent text,
  created_at timestamptz not null default now()
);

create table if not exists regions (
  id uuid primary key default gen_random_uuid(),
  country_id uuid references countries(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (country_id, name)
);

-- Destinations are the top-level "where should I go" unit shown in search
-- results. A destination groups one or more dive sites.
create table if not exists destinations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  country_id uuid references countries(id),
  region_id uuid references regions(id),
  latitude double precision,
  longitude double precision,
  geom geography(Point, 4326),
  summary text,
  hero_image_url text,
  -- dive-type tags this destination is broadly known for: shore, boat,
  -- liveaboard, resort, reef, wreck, wall, drift, muck, pelagic, macro,
  -- photo_friendly. Kept free-form (text[]) rather than an enum so the
  -- admin can extend the taxonomy without a migration.
  dive_type_tags text[] not null default '{}',
  -- true only for the isolated "Demo Island" destinations used to
  -- demonstrate the UI. Never mixed with real destinations in search
  -- results unless explicitly requested (?demo=1).
  demo_data boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_destinations_country on destinations(country_id);
create index if not exists idx_destinations_status on destinations(status);
create index if not exists idx_destinations_demo on destinations(demo_data);
create index if not exists idx_destinations_geom on destinations using gist(geom);

create table if not exists dive_sites (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  destination_id uuid not null references destinations(id) on delete cascade,
  name text not null,
  latitude double precision,
  longitude double precision,
  geom geography(Point, 4326),
  access_type text check (access_type in ('shore', 'boat', 'liveaboard')),
  site_type text[] not null default '{}', -- reef, wreck, wall, drift, muck, pelagic
  min_depth_m numeric,
  max_depth_m numeric,
  typical_current text check (typical_current in ('none', 'mild', 'moderate', 'strong', 'variable')),
  typical_visibility_m_min numeric,
  typical_visibility_m_max numeric,
  recommended_level text, -- free text, e.g. "Open Water", "Advanced" — never an authorization
  hazards text[],
  demo_data boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_dive_sites_destination on dive_sites(destination_id);
create index if not exists idx_dive_sites_status on dive_sites(status);
create index if not exists idx_dive_sites_geom on dive_sites using gist(geom);

-- Keep geom in sync with lat/lng whenever either is set via the app or admin UI.
create or replace function sync_geom_from_lat_lng() returns trigger as $$
begin
  if new.latitude is not null and new.longitude is not null then
    new.geom := geography(st_setsrid(st_makepoint(new.longitude, new.latitude), 4326));
  else
    new.geom := null;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_destinations_sync_geom on destinations;
create trigger trg_destinations_sync_geom
  before insert or update of latitude, longitude on destinations
  for each row execute function sync_geom_from_lat_lng();

drop trigger if exists trg_dive_sites_sync_geom on dive_sites;
create trigger trg_dive_sites_sync_geom
  before insert or update of latitude, longitude on dive_sites
  for each row execute function sync_geom_from_lat_lng();

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_destinations_updated_at on destinations;
create trigger trg_destinations_updated_at before update on destinations
  for each row execute function set_updated_at();

drop trigger if exists trg_dive_sites_updated_at on dive_sites;
create trigger trg_dive_sites_updated_at before update on dive_sites
  for each row execute function set_updated_at();
-- DiveFinder — 0003: marine species, destination/site associations, and
-- seasonality (species + environmental). Seasonality rows are only created
-- when a source-backed claim exists — never auto-filled.

create table if not exists marine_species (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  common_name text not null,
  scientific_name text not null,
  category text check (category in ('shark', 'ray', 'mammal', 'turtle', 'fish', 'other')),
  notes text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists destination_species (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid not null references destinations(id) on delete cascade,
  species_id uuid not null references marine_species(id) on delete cascade,
  demo_data boolean not null default false,
  created_at timestamptz not null default now(),
  unique (destination_id, species_id)
);

create table if not exists site_species (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references dive_sites(id) on delete cascade,
  species_id uuid not null references marine_species(id) on delete cascade,
  demo_data boolean not null default false,
  created_at timestamptz not null default now(),
  unique (site_id, species_id)
);

-- Qualitative, source-backed monthly suitability for seeing a given species
-- at a destination or site. Never a numeric probability (see docs/scoring.md).
create table if not exists species_seasonality (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid references destinations(id) on delete cascade,
  site_id uuid references dive_sites(id) on delete cascade,
  species_id uuid not null references marine_species(id) on delete cascade,
  month int not null check (month between 1 and 12),
  suitability text not null default 'unknown'
    check (suitability in ('excellent', 'good', 'possible', 'low', 'unknown')),
  source_id uuid, -- fk added in 0007 after data_sources exists
  demo_data boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint species_seasonality_scope check (destination_id is not null or site_id is not null)
);

create index if not exists idx_species_seasonality_dest on species_seasonality(destination_id, species_id, month);
create index if not exists idx_species_seasonality_site on species_seasonality(site_id, species_id, month);

-- Monthly environmental normals (water temp, visibility). Editorial /
-- climate-normal data, refreshed on an annual TTL — see docs/data-governance.md.
create table if not exists environmental_seasonality (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid references destinations(id) on delete cascade,
  site_id uuid references dive_sites(id) on delete cascade,
  month int not null check (month between 1 and 12),
  water_temp_c_min numeric,
  water_temp_c_max numeric,
  visibility_m_min numeric,
  visibility_m_max numeric,
  typical_conditions text,
  source_id uuid, -- fk added in 0007
  demo_data boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint environmental_seasonality_scope check (destination_id is not null or site_id is not null)
);

create index if not exists idx_env_seasonality_dest on environmental_seasonality(destination_id, month);
create index if not exists idx_env_seasonality_site on environmental_seasonality(site_id, month);

drop trigger if exists trg_marine_species_updated_at on marine_species;
create trigger trg_marine_species_updated_at before update on marine_species
  for each row execute function set_updated_at();

drop trigger if exists trg_species_seasonality_updated_at on species_seasonality;
create trigger trg_species_seasonality_updated_at before update on species_seasonality
  for each row execute function set_updated_at();

drop trigger if exists trg_env_seasonality_updated_at on environmental_seasonality;
create trigger trg_env_seasonality_updated_at before update on environmental_seasonality
  for each row execute function set_updated_at();
-- DiveFinder — 0004: certification agencies and certifications.
-- Certifications stay linked to their issuing agency; the app never
-- auto-maps one agency's level to another's ("N2 = Advanced") because
-- prerogatives differ and must stay traceable to a source.

create table if not exists certification_agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, -- PADI, SSI, NAUI, CMAS, BSAC, RAID, TDI, SDI, ...
  website text,
  created_at timestamptz not null default now()
);

create table if not exists certifications (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references certification_agencies(id) on delete cascade,
  name text not null, -- e.g. "Open Water Diver", "Advanced Open Water", "Rescue Diver"
  -- Informational ordering ONLY within the same agency. Never compared
  -- across agencies to decide dive-site eligibility.
  level_rank int,
  min_age int,
  notes text,
  source_id uuid, -- fk added in 0007
  created_at timestamptz not null default now(),
  unique (agency_id, name)
);

create index if not exists idx_certifications_agency on certifications(agency_id);
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
-- DiveFinder — 0006: dive centers, liveaboards, reviews, sightings, prices,
-- favorites and searches.

create table if not exists dive_centers (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid not null references destinations(id) on delete cascade,
  name text not null,
  center_type text[] not null default '{}', -- day_boat, resort, shop
  website text,
  contact_email text,
  latitude double precision,
  longitude double precision,
  demo_data boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists liveaboards (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid references destinations(id) on delete cascade,
  region_id uuid references regions(id),
  name text not null,
  operator_name text,
  itinerary_notes text,
  demo_data boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Community reviews. Data model ready in V1; submission UI is behind a
-- feature flag (see src/lib/utils/featureFlags.ts) and OFF by default.
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  entity_type text not null check (entity_type in ('destination', 'site', 'dive_center', 'liveaboard')),
  entity_id uuid not null,
  rating int check (rating between 1 and 5),
  dive_date date,
  visibility_bucket text,
  current_bucket text,
  water_temp_c numeric,
  species_observed uuid[] default '{}',
  operator_name text,
  note text,
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists idx_reviews_entity on reviews(entity_type, entity_id);

-- Dated, individual sightings. Never silently merged into
-- species_seasonality — see docs/data-governance.md.
create table if not exists species_sightings (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid references destinations(id) on delete cascade,
  site_id uuid references dive_sites(id) on delete cascade,
  species_id uuid not null references marine_species(id) on delete cascade,
  sighted_on date not null,
  source_id uuid, -- fk added in 0007
  reported_by uuid references profiles(id) on delete set null,
  notes text,
  review_status text not null default 'pending' check (review_status in ('pending', 'verified', 'disputed', 'rejected')),
  created_at timestamptz not null default now(),
  constraint species_sightings_scope check (destination_id is not null or site_id is not null)
);

create index if not exists idx_species_sightings_dest on species_sightings(destination_id, species_id);
create index if not exists idx_species_sightings_site on species_sightings(site_id, species_id);

create table if not exists prices (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('destination', 'dive_center', 'liveaboard')),
  entity_id uuid not null,
  price_type text not null check (
    price_type in ('single_dive', 'package', 'day_boat', 'resort', 'liveaboard', 'rental', 'nitrox', 'transfer', 'tax')
  ),
  amount_min numeric,
  amount_max numeric,
  currency char(3) not null default 'USD',
  inclusions text[] default '{}',
  exclusions text[] default '{}',
  provider text,
  source_id uuid, -- fk added in 0007
  observed_at timestamptz,
  expires_at timestamptz,
  demo_data boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_prices_entity on prices(entity_type, entity_id);
create index if not exists idx_prices_expires on prices(expires_at);

create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  entity_type text not null check (entity_type in ('destination', 'site')),
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, entity_type, entity_id)
);

create index if not exists idx_favorites_user on favorites(user_id);

create table if not exists searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  session_id text,
  criteria_json jsonb not null default '{}',
  results_count int,
  created_at timestamptz not null default now()
);

create index if not exists idx_searches_user on searches(user_id);
create index if not exists idx_searches_created on searches(created_at);

drop trigger if exists trg_dive_centers_updated_at on dive_centers;
create trigger trg_dive_centers_updated_at before update on dive_centers
  for each row execute function set_updated_at();

drop trigger if exists trg_liveaboards_updated_at on liveaboards;
create trigger trg_liveaboards_updated_at before update on liveaboards
  for each row execute function set_updated_at();

drop trigger if exists trg_prices_updated_at on prices;
create trigger trg_prices_updated_at before update on prices
  for each row execute function set_updated_at();
-- DiveFinder — 0007: data governance. This is the backbone of the
-- "no hallucinated data" product rule — see docs/data-governance.md.

create table if not exists data_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_type text not null check (
    source_type in ('official_operator', 'tourism_board', 'scientific', 'editorial', 'community', 'government', 'demo', 'other')
  ),
  url text,
  reliability text not null default 'medium' check (reliability in ('high', 'medium', 'low')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A single reusable "DEMO" source so demo-only rows always point at a
-- clearly-labelled, non-real source.
insert into data_sources (id, name, source_type, reliability, notes)
values ('00000000-0000-0000-0000-000000000001', 'DiveFinder Demo Data', 'demo', 'low',
        'Synthetic placeholder data used only by the isolated Demo Island destinations to exercise the UI. Never real.')
on conflict (id) do nothing;

create table if not exists data_claims (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  field_name text not null,
  value_json jsonb not null,
  unit text,
  source_id uuid references data_sources(id),
  source_type text,
  observed_at timestamptz,
  verified_at timestamptz,
  valid_from timestamptz,
  valid_to timestamptz,
  expires_at timestamptz,
  confidence text not null default 'medium' check (confidence in ('high', 'medium', 'low')),
  review_status text not null default 'pending' check (review_status in ('pending', 'verified', 'disputed', 'rejected')),
  reviewer_notes text,
  -- When a newer claim contradicts or replaces this one, point forward to
  -- it instead of deleting this row — full history + conflicts stay visible.
  superseded_by uuid references data_claims(id),
  demo_data boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_data_claims_entity on data_claims(entity_type, entity_id, field_name);
create index if not exists idx_data_claims_review_status on data_claims(review_status);
create index if not exists idx_data_claims_expires on data_claims(expires_at);
create index if not exists idx_data_claims_source on data_claims(source_id);

-- TTL bookkeeping per (entity, field) refresh job. ttl_category maps to the
-- TTL policy table in docs/data-governance.md.
create table if not exists data_refresh_jobs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null unique,
  entity_type text,
  field_name text,
  ttl_category text check (
    ttl_category in ('prices', 'operator_status', 'taxes_rules', 'seasonal_editorial', 'climate_normals', 'site_stable', 'recent_sighting')
  ),
  last_run_at timestamptz,
  next_due_at timestamptz,
  status text not null default 'idle' check (status in ('idle', 'running', 'success', 'error')),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists admin_review_queue (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  claim_id uuid references data_claims(id) on delete cascade,
  reason text not null check (reason in ('expired', 'disputed', 'missing_field', 'new_submission', 'flagged')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'dismissed')),
  assigned_to uuid references profiles(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_admin_review_queue_status on admin_review_queue(status);

-- Back-fill the source_id FKs that earlier migrations left as plain uuid
-- columns (data_sources did not exist yet at that point in migration order).
alter table species_seasonality
  add constraint species_seasonality_source_fk foreign key (source_id) references data_sources(id);
alter table environmental_seasonality
  add constraint environmental_seasonality_source_fk foreign key (source_id) references data_sources(id);
alter table certifications
  add constraint certifications_source_fk foreign key (source_id) references data_sources(id);
alter table species_sightings
  add constraint species_sightings_source_fk foreign key (source_id) references data_sources(id);
alter table prices
  add constraint prices_source_fk foreign key (source_id) references data_sources(id);

drop trigger if exists trg_data_sources_updated_at on data_sources;
create trigger trg_data_sources_updated_at before update on data_sources
  for each row execute function set_updated_at();

drop trigger if exists trg_data_claims_updated_at on data_claims;
create trigger trg_data_claims_updated_at before update on data_claims
  for each row execute function set_updated_at();

drop trigger if exists trg_data_refresh_jobs_updated_at on data_refresh_jobs;
create trigger trg_data_refresh_jobs_updated_at before update on data_refresh_jobs
  for each row execute function set_updated_at();

drop trigger if exists trg_admin_review_queue_updated_at on admin_review_queue;
create trigger trg_admin_review_queue_updated_at before update on admin_review_queue
  for each row execute function set_updated_at();

-- A claim never "silently disappears" when contradicted: whenever a claim is
-- marked disputed, push it (and its entity) into the review queue.
create or replace function enqueue_disputed_claim() returns trigger as $$
begin
  if new.review_status = 'disputed' and (old.review_status is distinct from 'disputed') then
    insert into admin_review_queue (entity_type, entity_id, claim_id, reason)
    values (new.entity_type, new.entity_id, new.id, 'disputed');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_enqueue_disputed_claim on data_claims;
create trigger trg_enqueue_disputed_claim
  after update of review_status on data_claims
  for each row execute function enqueue_disputed_claim();
-- DiveFinder — 0008: Row Level Security.
-- Public reference/content data is readable by anyone (anon included) but
-- only writable by admins. User-owned data (profile, diver profile,
-- certifications, favorites) is readable/writable only by its owner, with
-- admins able to read everything for support/back-office purposes.

create or replace function is_admin() returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer set search_path = public;

-- ── Reference / content tables: public read, admin write ──────────────────
do $$
declare
  t text;
begin
  foreach t in array array[
    'countries', 'regions', 'destinations', 'dive_sites',
    'marine_species', 'destination_species', 'site_species',
    'species_seasonality', 'environmental_seasonality',
    'certification_agencies', 'certifications',
    'dive_centers', 'liveaboards', 'prices'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I_public_read on %I', t, t);
    execute format('create policy %I_public_read on %I for select using (true)', t, t);
    execute format('drop policy if exists %I_admin_write on %I', t, t);
    execute format(
      'create policy %I_admin_write on %I for all using (is_admin()) with check (is_admin())',
      t, t
    );
  end loop;
end $$;

-- ── Data governance tables: admin only (never exposed to public clients) ──
do $$
declare
  t text;
begin
  foreach t in array array['data_sources', 'data_claims', 'data_refresh_jobs', 'admin_review_queue']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I_admin_all on %I', t, t);
    execute format(
      'create policy %I_admin_all on %I for all using (is_admin()) with check (is_admin())',
      t, t
    );
  end loop;
end $$;

-- ── Reviews: public read of published reviews, owner can insert/manage
--    their own pending submission, admin manages moderation ──────────────
alter table reviews enable row level security;

drop policy if exists reviews_public_read_published on reviews;
create policy reviews_public_read_published on reviews
  for select using (status = 'published' or is_admin() or user_id = auth.uid());

drop policy if exists reviews_owner_insert on reviews;
create policy reviews_owner_insert on reviews
  for insert with check (auth.uid() is not null and user_id = auth.uid());

drop policy if exists reviews_owner_update on reviews;
create policy reviews_owner_update on reviews
  for update using (user_id = auth.uid() or is_admin());

drop policy if exists reviews_admin_delete on reviews;
create policy reviews_admin_delete on reviews
  for delete using (is_admin());

-- ── Species sightings: public read of verified sightings, owner can submit,
--    admin moderates ─────────────────────────────────────────────────────
alter table species_sightings enable row level security;

drop policy if exists sightings_public_read_verified on species_sightings;
create policy sightings_public_read_verified on species_sightings
  for select using (review_status = 'verified' or is_admin() or reported_by = auth.uid());

drop policy if exists sightings_owner_insert on species_sightings;
create policy sightings_owner_insert on species_sightings
  for insert with check (auth.uid() is not null and reported_by = auth.uid());

drop policy if exists sightings_admin_manage on species_sightings;
create policy sightings_admin_manage on species_sightings
  for update using (is_admin());

drop policy if exists sightings_admin_delete on species_sightings;
create policy sightings_admin_delete on species_sightings
  for delete using (is_admin());

-- ── Profiles: user reads/updates own row, admin reads/updates all ────────
alter table profiles enable row level security;

drop policy if exists profiles_self_read on profiles;
create policy profiles_self_read on profiles
  for select using (id = auth.uid() or is_admin());

drop policy if exists profiles_self_update on profiles;
create policy profiles_self_update on profiles
  for update using (id = auth.uid() or is_admin());

-- ── Diver profiles, certifications, favorites: strictly owner-only (+admin
--    read for support) ────────────────────────────────────────────────────
do $$
declare
  t text;
begin
  foreach t in array array['diver_profiles', 'user_certifications', 'favorites']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I_owner_all on %I', t, t);
    execute format(
      'create policy %I_owner_all on %I for all using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid())',
      t, t
    );
  end loop;
end $$;

-- ── Searches: written server-side (service role bypasses RLS for anonymous
--    logging); authenticated users can read their own history, admin reads
--    all for analytics ───────────────────────────────────────────────────
alter table searches enable row level security;

drop policy if exists searches_owner_read on searches;
create policy searches_owner_read on searches
  for select using (user_id = auth.uid() or is_admin());

drop policy if exists searches_owner_insert on searches;
create policy searches_owner_insert on searches
  for insert with check (user_id = auth.uid() or user_id is null);
-- DiveFinder — 0009: Data Health measurement.
-- Defines which fields are "critical" per entity type, and views that
-- compute the metrics required by Admin > Data Health
-- (docs/data-governance.md §22).

create table if not exists critical_fields_registry (
  entity_type text not null,
  field_name text not null,
  primary key (entity_type, field_name)
);

insert into critical_fields_registry (entity_type, field_name) values
  ('destination', 'best_months'),
  ('destination', 'budget_indicative'),
  ('destination', 'recommended_level'),
  ('destination', 'water_temp_range'),
  ('dive_site', 'depth_range'),
  ('dive_site', 'visibility_range'),
  ('dive_site', 'current'),
  ('dive_site', 'recommended_level')
on conflict do nothing;

-- Non-demo, non-superseded claims that are still within their validity
-- window (never surfaced as "current" once expired).
create or replace view v_fresh_data_claims as
select *
from data_claims
where demo_data = false
  and superseded_by is null
  and (expires_at is null or expires_at > now());

create or replace view v_expired_data_claims as
select *
from data_claims
where demo_data = false
  and superseded_by is null
  and expires_at is not null
  and expires_at <= now();

create or replace view v_destination_critical_field_coverage as
select
  d.id as destination_id,
  d.name,
  count(distinct cfr.field_name) as critical_fields_total,
  count(distinct dc.field_name) filter (
    where dc.review_status = 'verified' and (dc.expires_at is null or dc.expires_at > now())
  ) as critical_fields_sourced
from destinations d
cross join critical_fields_registry cfr
left join data_claims dc
  on dc.entity_type = 'destination'
  and dc.entity_id = d.id
  and dc.field_name = cfr.field_name
  and dc.demo_data = false
  and dc.superseded_by is null
where cfr.entity_type = 'destination'
  and d.demo_data = false
group by d.id, d.name;

create or replace view v_dive_site_critical_field_coverage as
select
  s.id as site_id,
  s.name,
  count(distinct cfr.field_name) as critical_fields_total,
  count(distinct dc.field_name) filter (
    where dc.review_status = 'verified' and (dc.expires_at is null or dc.expires_at > now())
  ) as critical_fields_sourced
from dive_sites s
cross join critical_fields_registry cfr
left join data_claims dc
  on dc.entity_type = 'dive_site'
  and dc.entity_id = s.id
  and dc.field_name = cfr.field_name
  and dc.demo_data = false
  and dc.superseded_by is null
where cfr.entity_type = 'dive_site'
  and s.demo_data = false
group by s.id, s.name;

-- A destination/site is "ready" once at least half its registered critical
-- fields carry a verified, non-expired claim. Threshold is intentionally
-- conservative for V1 — tune in docs/data-governance.md if needed.
create or replace view v_data_health_summary as
select
  (
    select coalesce(round(100.0 * sum(critical_fields_sourced) / nullif(sum(critical_fields_total), 0)), 0)
    from (
      select * from v_destination_critical_field_coverage
      union all
      select site_id, name, critical_fields_total, critical_fields_sourced from v_dive_site_critical_field_coverage
    ) all_coverage
  ) as critical_fields_sourced_pct,
  (
    select coalesce(round(100.0 * count(*) filter (where expires_at is null or expires_at > now())
      / nullif(count(*), 0)), 0)
    from data_claims
    where demo_data = false and superseded_by is null
  ) as fresh_claims_pct,
  (
    select count(*) from v_destination_critical_field_coverage
    where critical_fields_total > 0 and critical_fields_sourced::float / critical_fields_total >= 0.5
  ) as destinations_ready_count,
  (
    select count(*) from v_dive_site_critical_field_coverage
    where critical_fields_total > 0 and critical_fields_sourced::float / critical_fields_total >= 0.5
  ) as dive_sites_ready_count,
  (
    select count(*) from marine_species s
    where exists (select 1 from destination_species ds where ds.species_id = s.id)
       or exists (select 1 from site_species ss where ss.species_id = s.id)
  ) as species_ready_count,
  (
    select count(*) from data_claims where review_status = 'disputed' and demo_data = false
  ) as disputed_claims_count,
  (
    select count(*) from data_claims
    where demo_data = false and superseded_by is null
      and field_name in ('price', 'amount_min', 'amount_max')
      and expires_at is not null and expires_at <= now()
  ) as expired_price_claims_count,
  (
    select count(*) from destinations where demo_data = false and status = 'published'
  ) as published_destinations_count,
  (
    select count(*) from data_sources where source_type <> 'demo'
  ) as active_sources_count,
  (
    select count(*) from admin_review_queue where status = 'open'
  ) as open_review_queue_count;
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
-- DiveFinder — 0011: richer diver profile.
-- Adds: profile bio/home base, an avatar storage bucket, named saved lists
-- (favorites grouped instead of one flat pile), and a personal species
-- "life list" (species the diver has personally seen — distinct from the
-- public/editorial `species_sightings` table, which is sourced content).

alter table profiles add column if not exists bio text;
alter table profiles add column if not exists home_base text;

-- ── Avatar storage ──────────────────────────────────────────────────────
-- Public bucket: avatars are meant to be visible (same as any profile
-- picture on the web). Upload path convention enforced by policy:
-- avatars/{user_id}/{filename} — so a user can only write inside their own
-- folder, checked via the first path segment.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists avatars_public_read on storage.objects;
create policy avatars_public_read on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists avatars_owner_write on storage.objects;
create policy avatars_owner_write on storage.objects
  for insert with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_owner_update on storage.objects;
create policy avatars_owner_update on storage.objects
  for update using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_owner_delete on storage.objects;
create policy avatars_owner_delete on storage.objects
  for delete using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── Named saved lists ───────────────────────────────────────────────────
-- A favorite with list_id = null is shown as "Unsorted" — lists are an
-- optional layer of organization on top of the existing favorites table,
-- not a replacement for it.
create table if not exists saved_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists idx_saved_lists_user on saved_lists(user_id);

alter table favorites add column if not exists list_id uuid references saved_lists(id) on delete set null;

-- ── Personal species life list ──────────────────────────────────────────
create table if not exists user_species_seen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  species_id uuid not null references marine_species(id) on delete cascade,
  seen_on date,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, species_id)
);

create index if not exists idx_user_species_seen_user on user_species_seen(user_id);

-- ── RLS: owner-only, same pattern as diver_profiles/favorites ───────────
do $$
declare
  t text;
begin
  foreach t in array array['saved_lists', 'user_species_seen']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I_owner_all on %I', t, t);
    execute format(
      'create policy %I_owner_all on %I for all using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid())',
      t, t
    );
  end loop;
end $$;
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
-- DiveFinder — 0013: mask fit concerns.
-- Self-reported recurring mask problems (leaks, fogging, nose pain…),
-- collected by the Mask Finder's concerns step. Stored separately from
-- the sourced `masks` catalog data on purpose — this is the diver's own
-- declared experience, never treated as a verified fact about any mask,
-- and never merged into per-mask suitability matching (see
-- docs/gear-mask-finder.md). Used only to surface general, non-mask-
-- specific fit tips alongside results.
alter table diver_profiles add column if not exists mask_fit_concerns text[] not null default '{}';
-- DiveFinder — 0014: liveaboards need an outbound booking link, same as
-- dive_centers already has. Without it, a real liveaboard entry has no way
-- to send a diver to book it — see docs/operators.md.
alter table liveaboards add column if not exists website text;
-- DiveFinder — 0015: uniqueness for operator upserts.
-- The weekly operator-refresh routine (see docs/operators.md) needs to
-- re-run its inserts safely without creating duplicate rows every week —
-- these constraints let it use `on conflict (destination_id, name) do
-- update` instead of blind inserts.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'dive_centers_destination_name_key') then
    alter table dive_centers add constraint dive_centers_destination_name_key unique (destination_id, name);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'liveaboards_destination_name_key') then
    alter table liveaboards add constraint liveaboards_destination_name_key unique (destination_id, name);
  end if;
end $$;
-- DiveFinder — 0016: dive_centers needs a description field (liveaboards
-- already has itinerary_notes; dive_centers had nothing, which would have
-- thrown away real, sourced operator descriptions found during research —
-- see docs/operators.md). Also makes data_sources.name unique so the
-- weekly operator-refresh routine can upsert sources idempotently.
alter table dive_centers add column if not exists notes text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'data_sources_name_key') then
    alter table data_sources add constraint data_sources_name_key unique (name);
  end if;
end $$;
-- DiveFinder — 0017: personal reservation tracker.
-- Phase 1 of the booking roadmap: divers manually record trips they've
-- booked elsewhere (a dive center, a liveaboard, or just a destination),
-- and track them as upcoming/past/cancelled — a Booking.com-style trip
-- list. Not a real booking/payment flow yet; that requires operator
-- partnerships first. operator_id is deliberately not a foreign key: it
-- can point at either dive_centers or liveaboards depending on
-- operator_type, and a reservation must still be recordable with a free-
-- text operator name for operators not yet in the catalog.

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  destination_id uuid references destinations(id) on delete set null,
  destination_name text,
  operator_type text check (operator_type in ('dive_center', 'liveaboard')),
  operator_id uuid,
  operator_name text,
  start_date date not null,
  end_date date,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reservations_user on reservations(user_id, start_date desc);

alter table reservations enable row level security;

drop policy if exists reservations_owner_all on reservations;
create policy reservations_owner_all on reservations
  for all using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid());

drop trigger if exists trg_reservations_updated_at on reservations;
create trigger trg_reservations_updated_at before update on reservations
  for each row execute function set_updated_at();
-- DiveFinder — 0018: social graph foundation (follow, public profiles,
-- per-entry logbook visibility).
--
-- The Logbook has always promised "private, never shared publicly" — that
-- promise stays true for existing and future entries by default:
-- dive_log_entries.visibility defaults to 'private', so nothing becomes
-- visible to anyone else unless the diver explicitly changes it on that
-- entry. Profile-level visibility (name/bio/badges/aggregate stats, never
-- individual dive content) defaults to 'public' instead — closer to how
-- Strava's athlete profiles work, and there is no existing "always
-- private" promise attached to the profile page the way there is for the
-- Logbook.

alter table profiles add column if not exists profile_visibility text not null default 'public'
  check (profile_visibility in ('public', 'followers', 'private'));

alter table dive_log_entries add column if not exists visibility text not null default 'private'
  check (visibility in ('public', 'followers', 'private'));

create table if not exists follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references profiles(id) on delete cascade,
  followee_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index if not exists idx_follows_follower on follows(follower_id);
create index if not exists idx_follows_followee on follows(followee_id);

alter table follows enable row level security;

-- The follow graph itself (who follows whom) is not sensitive the way an
-- individual dive's notes are — readable by anyone, same as follower/
-- following counts on any social app. Only the follower can create/remove
-- their own follow.
drop policy if exists follows_public_read on follows;
create policy follows_public_read on follows for select using (true);

drop policy if exists follows_owner_insert on follows;
create policy follows_owner_insert on follows for insert with check (follower_id = auth.uid());

drop policy if exists follows_owner_delete on follows;
create policy follows_owner_delete on follows for delete using (follower_id = auth.uid());

-- ── Extra, additive read policies (existing owner-only policies on
--    profiles/dive_log_entries are untouched — Postgres OR's permissive
--    policies together, so the owner keeps full access regardless). ──────

drop policy if exists profiles_visibility_read on profiles;
create policy profiles_visibility_read on profiles
  for select using (
    profile_visibility = 'public'
    or (profile_visibility = 'followers' and exists (
      select 1 from follows f where f.follower_id = auth.uid() and f.followee_id = profiles.id
    ))
  );

drop policy if exists dive_log_entries_visibility_read on dive_log_entries;
create policy dive_log_entries_visibility_read on dive_log_entries
  for select using (
    visibility = 'public'
    or (visibility = 'followers' and exists (
      select 1 from follows f where f.follower_id = auth.uid() and f.followee_id = dive_log_entries.user_id
    ))
  );

-- Shared visibility check, reused by kudos/comments/photos RLS so the rule
-- lives in exactly one place instead of being copy-pasted per table.
create or replace function can_view_dive_entry(entry_id uuid) returns boolean as $$
  select exists (
    select 1 from dive_log_entries e
    where e.id = entry_id
      and (
        e.user_id = auth.uid()
        or e.visibility = 'public'
        or (e.visibility = 'followers' and exists (
          select 1 from follows f where f.follower_id = auth.uid() and f.followee_id = e.user_id
        ))
        or is_admin()
      )
  );
$$ language sql stable security definer set search_path = public;
-- DiveFinder — 0019: kudos + comments on shared dive log entries.
-- Only reachable at all once a dive is shared (visibility != 'private'),
-- enforced via can_view_dive_entry() from 0018 — reused rather than
-- re-deriving the same rule per table.

create table if not exists dive_kudos (
  id uuid primary key default gen_random_uuid(),
  dive_log_entry_id uuid not null references dive_log_entries(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (dive_log_entry_id, user_id)
);

create index if not exists idx_dive_kudos_entry on dive_kudos(dive_log_entry_id);

alter table dive_kudos enable row level security;

drop policy if exists dive_kudos_read on dive_kudos;
create policy dive_kudos_read on dive_kudos
  for select using (can_view_dive_entry(dive_log_entry_id));

drop policy if exists dive_kudos_insert on dive_kudos;
create policy dive_kudos_insert on dive_kudos
  for insert with check (user_id = auth.uid() and can_view_dive_entry(dive_log_entry_id));

drop policy if exists dive_kudos_delete on dive_kudos;
create policy dive_kudos_delete on dive_kudos
  for delete using (user_id = auth.uid());

create table if not exists dive_comments (
  id uuid primary key default gen_random_uuid(),
  dive_log_entry_id uuid not null references dive_log_entries(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists idx_dive_comments_entry on dive_comments(dive_log_entry_id, created_at);

alter table dive_comments enable row level security;

drop policy if exists dive_comments_read on dive_comments;
create policy dive_comments_read on dive_comments
  for select using (can_view_dive_entry(dive_log_entry_id));

drop policy if exists dive_comments_insert on dive_comments;
create policy dive_comments_insert on dive_comments
  for insert with check (user_id = auth.uid() and can_view_dive_entry(dive_log_entry_id));

drop policy if exists dive_comments_delete on dive_comments;
create policy dive_comments_delete on dive_comments
  for delete using (user_id = auth.uid() or is_admin());
-- DiveFinder — 0020: dive log photos.
--
-- Unlike avatars (0011 — a public bucket, always visible), a dive photo's
-- visibility must follow its dive_log_entry's own privacy setting: a
-- photo on a private entry must not be fetchable by anyone else, even by
-- guessing/sharing the storage URL. So this bucket is NOT public, and the
-- read policy re-checks can_view_dive_entry() (from 0018) against the
-- entry_id encoded in the storage path, same rule as the row-level table.
--
-- Path convention: dive-photos/{user_id}/{dive_log_entry_id}/{filename}
-- — the first segment enforces upload ownership, the second lets the read
-- policy find the right entry to check visibility against.

create table if not exists dive_log_photos (
  id uuid primary key default gen_random_uuid(),
  dive_log_entry_id uuid not null references dive_log_entries(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists idx_dive_log_photos_entry on dive_log_photos(dive_log_entry_id);

alter table dive_log_photos enable row level security;

drop policy if exists dive_log_photos_read on dive_log_photos;
create policy dive_log_photos_read on dive_log_photos
  for select using (can_view_dive_entry(dive_log_entry_id));

drop policy if exists dive_log_photos_owner_insert on dive_log_photos;
create policy dive_log_photos_owner_insert on dive_log_photos
  for insert with check (user_id = auth.uid());

drop policy if exists dive_log_photos_owner_delete on dive_log_photos;
create policy dive_log_photos_owner_delete on dive_log_photos
  for delete using (user_id = auth.uid() or is_admin());

insert into storage.buckets (id, name, public)
values ('dive-photos', 'dive-photos', false)
on conflict (id) do nothing;

drop policy if exists dive_photos_owner_write on storage.objects;
create policy dive_photos_owner_write on storage.objects
  for insert with check (
    bucket_id = 'dive-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists dive_photos_owner_delete on storage.objects;
create policy dive_photos_owner_delete on storage.objects
  for delete using (
    bucket_id = 'dive-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists dive_photos_visibility_read on storage.objects;
create policy dive_photos_visibility_read on storage.objects
  for select using (
    bucket_id = 'dive-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or can_view_dive_entry(((storage.foldername(name))[2])::uuid)
    )
  );
