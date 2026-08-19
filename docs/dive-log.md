# Logbook

A private, per-diver dive log — distinct from every other table in this
schema, which is either public reference content (destinations, sites,
species) or a sourced/moderated claim (`data_claims`, reviews). Nothing in
`dive_log_entries` is ever treated as verified data about a destination or
site; it's the diver's own record, readable only by them (and admins, for
support) via owner-only RLS — same pattern as `diver_profiles`/`favorites`.

## What it stores

Date, a linked catalog site (`site_id`) *or* a free-text name for a spot
not in DiveFinder yet (`site_name`) — never both required — duration, max
and average depth, water temperature, visibility/current buckets, buddy
name, gas type (air/nitrox, with percentage), species observed, a personal
1–5 rating, and free-text notes.

## Life-list integration

When a dive log entry is saved, every species in `species_observed` is
also upserted into `user_species_seen` (the same table backing the
Wildlife pages' "My life list" filter — see the profile-v2 migration) with
`seen_on` set to the dive date. This is the one place in the app where
writing to one user-owned table has a side effect on another — intentional
and documented here rather than hidden: logging a dive with a species you
saw *is* seeing that species. See `src/lib/services/diveLogService.ts` →
`createDiveLogEntry`.

## Files

- `supabase/migrations/0012_dive_log.sql` — `dive_log_entries` table + RLS.
- `src/lib/services/diveLogService.ts` — CRUD + `computeDiveLogStats`
  (total dives, total bottom time, deepest dive — pure aggregation over
  what the diver actually entered, never estimated).
- `src/components/logbook/DiveLogForm.tsx` — shared create/edit form.
- `src/app/logbook/{page,new/page,[id]/page}.tsx` — list, create, edit/delete.
