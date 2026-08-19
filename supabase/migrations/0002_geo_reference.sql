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
