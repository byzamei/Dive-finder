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
