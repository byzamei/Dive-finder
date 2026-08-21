# Social layer

A Strava/Wanderlog-inspired layer on top of the existing Logbook and
Wildlife life list — not a separate feature bolted on top, the same
underlying data with a visibility setting and a few new tables around it.

## The privacy model

Two independent visibility settings, both defaulting to the safer option:

- **`profiles.profile_visibility`** (`public` | `followers` | `private`,
  default `public`) — governs the profile page itself: display name,
  avatar, bio, home base, and stats derived only from already-visible data
  (dives shared, species seen in shared dives, follower/following counts).
  Defaults public because there's no prior promise attached to the profile
  page, and a profile people can't find defeats the point of a "find and
  follow other divers" feature.
- **`dive_log_entries.visibility`** (`public` | `followers` | `private`,
  default `private`) — per dive. The Logbook has always said "private,
  never shared publicly"; that stays true by default for every existing
  and future entry. Sharing is opt-in, per entry, from that entry's own
  edit page — never a bulk toggle, never inherited from the profile
  setting.

`diver_profiles` (certifications, safety-relevant fields used for search
scoring) and `user_species_seen` (the life list as a raw table) are
**not** part of this — they stay strictly owner-only, same RLS as before
this feature. The public profile's "species seen" stat is computed only
from species logged on already-shared dives, not from the private life
list table, so it never leaks more than what's already visible.

## Enforcement

`can_view_dive_entry(entry_id)` (0018_social_graph.sql) is the single rule
— owner, or `public`, or `followers` + an existing `follows` row — reused
by RLS on `dive_kudos`, `dive_comments`, `dive_log_photos`, and the
`dive-photos` storage bucket's read policy, instead of re-deriving the
same logic per table. Application code (`socialFeedService.ts`) adds an
explicit "people I follow, or me" filter on top for feed *semantics*
(what belongs in a feed) — RLS alone would also allow reading a stranger's
`public` dive by direct query, which is correct for a profile page but not
what a "feed" should silently include beyond who's actually followed.

## Photos

`dive-photos` is a **private** Storage bucket (unlike `avatars`, which is
public — an avatar has no privacy story, a dive photo inherits its dive's).
Path convention `{user_id}/{dive_log_entry_id}/{file}`. Reads go through
`createSignedUrl` (1-hour TTL) rather than a public URL, and the bucket's
own read policy re-checks `can_view_dive_entry()` against the entry_id in
the path — a signed link expires and a private entry's photos are never
fetchable by URL-guessing.

## What's out of scope for this pass

- Segments/leaderboards, clubs, and year-in-review — noted in the initial
  feature inventory, not built.
- A `username` slug — profile URLs are `/divers/{userId}` (a UUID), not a
  vanity handle.
- Editing/deleting a comment as its author (only deleting your own kudos
  is wired up beyond posting).
