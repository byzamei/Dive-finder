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
