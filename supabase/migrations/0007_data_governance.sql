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
