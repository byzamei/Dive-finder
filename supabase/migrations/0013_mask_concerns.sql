-- DiveFinder — 0013: mask fit concerns.
-- Self-reported recurring mask problems (leaks, fogging, nose pain…),
-- collected by the Mask Finder's concerns step. Stored separately from
-- the sourced `masks` catalog data on purpose — this is the diver's own
-- declared experience, never treated as a verified fact about any mask,
-- and never merged into per-mask suitability matching (see
-- docs/gear-mask-finder.md). Used only to surface general, non-mask-
-- specific fit tips alongside results.
alter table diver_profiles add column if not exists mask_fit_concerns text[] not null default '{}';
