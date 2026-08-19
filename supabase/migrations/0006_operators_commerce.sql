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
