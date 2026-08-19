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
