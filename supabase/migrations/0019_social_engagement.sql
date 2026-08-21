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
