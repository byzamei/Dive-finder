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
