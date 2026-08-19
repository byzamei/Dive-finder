# Diver reviews

Community trip reports on destinations and dive sites — the "AllTrails trail
report" equivalent for DiveFinder. The `reviews` table was modeled in V1 but
its submission UI stayed behind a feature flag until moderation tooling
existed (see product brief §15); both now exist and the flag
(`communityReviewSubmission` in `src/lib/utils/featureFlags.ts`) is on.

## Flow

1. A signed-in diver submits a review from a destination or site page
   (`src/components/reviews/ReviewForm.tsx`): star rating (required),
   optional dive date, visibility/current buckets, water temperature,
   species observed, operator mentioned, and free-text notes.
2. The row is inserted with `status = 'pending'` — never visible to other
   users yet (`reviews_public_read_published` RLS policy in
   `0008_rls_policies.sql` only shows `published` rows, or the author's own).
3. An admin moderates it at `/admin/reviews`
   (`src/app/admin/reviews/page.tsx`) — publish or reject. There's no
   silent auto-publish; every review is read by a human first.
4. Published reviews show on the destination/site page
   (`src/components/reviews/ReviewsList.tsx`) and feed the **Quality/reviews**
   scoring dimension (`src/lib/scoring/dimensions.ts` →
   `scoreQualityReviews`) via `src/lib/services/searchService.ts`, which
   already averaged `rating` over published reviews — no scoring-engine
   changes were needed for this feature.

## Design choices

- **One review per user per entity, enforced in the UI, not the schema.**
  `getUserReviewForEntity` checks for an existing row (any status) before
  showing the form; if one exists, the diver sees its status instead of a
  duplicate form. No unique constraint was added to keep the change
  additive to the existing migration.
- **Reviewer identity is never shown.** Reviews render as "A diver" — the
  `profiles` table's RLS (`profiles_self_read`) only lets a user read their
  own profile row, so there's no safe way to join another user's display
  name for public display without a schema/RLS change. Anonymous-but-dated
  attribution ("A diver · 3 days ago") was chosen over widening that policy.
- **Never averaged into a static claim.** Reviews stay their own signal
  (`entity_type`/`entity_id` + `status = 'published'`), never merged into
  `data_claims` — consistent with `docs/data-governance.md`'s rule that
  sourced facts and community opinion are never conflated.
