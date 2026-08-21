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
