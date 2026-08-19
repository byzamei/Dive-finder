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
