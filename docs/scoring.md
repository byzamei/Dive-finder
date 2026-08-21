# Scoring

Code: `src/lib/scoring/` (`weights.ts`, `types.ts`, `hardFilters.ts`,
`preferenceFilters.ts`, `dimensions.ts`, `scoringService.ts`). Fully unit
tested in `tests/unit/scoring.test.ts` (T001, T002, T005, T006, T007, T010,
T011).

## 1. Two exclusion layers run before scoring: safety, then preference

Both only ever exclude or (for safety) warn — neither ever awards points.
`scoreDestination()` runs both; a destination excluded by either is dropped
from `ranked` entirely (`scoreAllDestinations()`).

**1a. `applyHardFilters()` — safety, gated on confidence.** A destination is
**excluded** when a safety-relevant fact is known with **high confidence**
and conflicts with the searcher's declared experience:

- Beginner-like diver (`numberOfDivesBucket` < 25 dives, or
  `currentExperience` in `none|some`) + a `typicalCurrent: 'strong'` claim
  at `confidence: 'high'` → excluded.
- A destination's `safetyRequirement.minExperience` (parsed from a
  `recommended_level` claim) not met, at `confidence: 'high'` → excluded.

When the same facts exist at **medium/low confidence**, or when the
searcher gave no experience info at all, the destination is **never**
excluded — instead a `hardFilterWarnings` message like "check operator
requirements" is attached and the destination scores normally. Diver info
is entirely optional; an anonymous/blank search can never be hard-filtered
by something it wasn't told (T007).

**Cave diving is always a warning, never gated on declared experience.**
`diver_profiles.cave_experience_declared` and `SearchCriteria.caveDeclared`
are self-reported only — a cave-flagged site always surfaces the
"confirm cave-specific credentials with the operator" warning regardless of
what the diver declared. Declared experience is never an authorization.

**1b. `applyPreferenceFilters()` — the searcher's own criteria, gated on
data, not confidence.** Budget, dive type, conditions, and wildlife are
otherwise scored (never excluded) by the weighted dimensions below — but a
destination is also **excluded outright** the moment we hold a fact that
affirmatively rules it out for one of these:

- **Budget**: the cheapest known price (a destination-level price if one
  exists, else the cheapest current operator price — see
  `indicativeBudget` in `types.ts`) is above `budgetTotal`, **in the same
  currency** as `criteria.currency`. Cross-currency prices are never
  compared (no real exchange rate to use honestly), so they neither exclude
  nor get flagged — see `docs/data-governance.md`.
- **Dive type**: the destination has `dive_type_tags` and none of them are
  in `criteria.diveTypes`.
- **Conditions**: `typicalCurrent` is known and not in
  `criteria.acceptedCurrent`.
- **Wildlife**: none of `criteria.speciesIds` has any evidence at this
  destination — no `destination_species` presence link and no
  `species_seasonality` row for any of them. This is OR across the
  selection (any one matching species is enough to keep the destination) —
  checking several species means "show me destinations with any of these,"
  not "all of them at once."

Exactly like the safety filters, **missing data never excludes** — a
destination with no price, no tags, no known current, or no wildlife
records for the requested criterion stays in, because we cannot honestly
say it fails something we have no data on. Only an affirmative fact
excludes.

## 2. Eight weighted dimensions, summing to 100

| Dimension | Weight | Null when… |
|---|---|---|
| Seasonality | 20 | no `months` selected, or no environmental data for any selected month |
| Wildlife match | 20 | no `speciesIds` selected, or none of them have any seasonality data at this destination |
| Budget fit | 15 | no `budgetTotal`, or no indicative price data |
| Level/experience fit | 15 | no safety requirement data, or diver gave no experience info |
| Conditions fit | 10 | no `acceptedCurrent`, or destination's current is unknown |
| Dive type fit | 10 | no `diveTypes` selected, or destination has no tags |
| Accessibility | 5 | **always** — V1 has no verified travel-time/flight data source (out of scope, see product brief §14) |
| Quality/reviews | 5 | no *published* reviews yet for that destination — see `docs/reviews.md` |

Each dimension function in `dimensions.ts` returns a number in `[0, 1]` or
`null`. **`null` is load-bearing** — it means "no data", and is excluded
from both the numerator and the denominator when aggregating, never treated
as 0 (T010). This is different from most naive weighted-average
implementations, which is the whole point: a destination with 3 known
dimensions is scored on those 3, re-normalized to 100, and its **Data
completeness %** (a *separate* number) tells you how much of the full
picture that represents.

```
matchScore = round( Σ(value[d] * weight[d] for known d) / Σ(weight[d] for known d) * 100 )
dataCompletenessPct = round( Σ(weight[d] for known d) / 100 * 100 )
```

Worked example: only Seasonality (weight 20) has data and scores 1.0 →
`matchScore = 100`, `dataCompletenessPct = 20`. A 100/100 match score next
to a 20% completeness score is intentional — the UI must show both (see
`ResultCard`), never the match score alone.

## 3. Reasons, trade-offs, and unknowns

`buildReasonsAndTradeOffs()` buckets each dimension by its raw `[0,1]`
value: `>= 0.7` → "Why it matches" reason, `< 0.5` → trade-off, `null` →
unknown (always listed, never hidden). This is what powers the required
"why does this destination appear, and what don't we know" explanation on
every result card and detail page.

## 4. Never a fabricated wildlife percentage

`species_seasonality.suitability` is qualitative
(`excellent/good/possible/low/unknown`). `scoreWildlifeMatch()` maps these
to internal weights purely to rank destinations against each other — the UI
never converts this into a "% chance of seeing X" figure. `SuitabilityBadge`
always renders the qualitative label.

## 5. Low-data results banner

`scoreAllDestinations()` returns `lowDataWarning: true` when the *average*
`dataCompletenessPct` across all (non-excluded) results is below 40% — the
Results page then shows "treat this ranking as exploratory" instead of
presenting it as authoritative (product brief §8/§9).

## Adjusting weights

Weights live in one place (`SCORE_WEIGHTS` in `weights.ts`) and are asserted
to sum to 100 at import time. Changing them only requires updating that
object and this doc — no scattered magic numbers elsewhere.
