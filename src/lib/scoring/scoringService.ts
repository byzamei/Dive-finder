import type { Destination, ScoreBreakdown, ScoredDestination, SearchCriteria } from "@/lib/types/domain";
import { SCORE_WEIGHTS, TOTAL_WEIGHT, type ScoreDimension } from "./weights";
import { applyHardFilters } from "./hardFilters";
import { applyPreferenceFilters } from "./preferenceFilters";
import {
  scoreAccessibility,
  scoreBudgetFit,
  scoreConditionsFit,
  scoreDiveTypeFit,
  scoreLevelFit,
  scoreQualityReviews,
  scoreSeasonality,
  scoreWildlifeMatch,
  type DimensionScore,
} from "./dimensions";
import type { DestinationScoringFacts } from "./types";

const DIMENSION_LABEL: Record<ScoreDimension, string> = {
  seasonality: "Seasonality",
  wildlifeMatch: "Wildlife you want to see",
  budgetFit: "Budget",
  levelFit: "Level / experience fit",
  conditionsFit: "Conditions you accept",
  diveTypeFit: "Dive type",
  accessibility: "Accessibility",
  qualityReviews: "Reviews",
};

/** Result of scoring one destination, before hard-filter exclusion is applied. */
export interface RawScore {
  dimensions: Record<ScoreDimension, DimensionScore>;
  matchScore: number;
  dataCompletenessPct: number;
}

export function computeDimensions(
  facts: DestinationScoringFacts,
  criteria: SearchCriteria
): Record<ScoreDimension, DimensionScore> {
  return {
    seasonality: scoreSeasonality(facts, criteria),
    wildlifeMatch: scoreWildlifeMatch(facts, criteria),
    budgetFit: scoreBudgetFit(facts, criteria),
    levelFit: scoreLevelFit(facts, criteria),
    conditionsFit: scoreConditionsFit(facts, criteria),
    diveTypeFit: scoreDiveTypeFit(facts, criteria),
    accessibility: scoreAccessibility(),
    qualityReviews: scoreQualityReviews(facts),
  };
}

/**
 * Aggregates per-dimension scores into a single 0-100 match score,
 * re-normalized over only the dimensions that had data — an unscored
 * dimension is EXCLUDED from the denominator, never counted as zero. See
 * docs/scoring.md and test T010.
 */
export function aggregateScore(dimensions: Record<ScoreDimension, DimensionScore>): RawScore {
  let weightedSum = 0;
  let knownWeight = 0;

  (Object.keys(SCORE_WEIGHTS) as ScoreDimension[]).forEach((dim) => {
    const value = dimensions[dim];
    const weight = SCORE_WEIGHTS[dim];
    if (value != null) {
      weightedSum += value * weight;
      knownWeight += weight;
    }
  });

  const matchScore = knownWeight === 0 ? 0 : Math.round((weightedSum / knownWeight) * 100);
  const dataCompletenessPct = Math.round((knownWeight / TOTAL_WEIGHT) * 100);

  return { dimensions, matchScore, dataCompletenessPct };
}

function toBreakdown(dimensions: Record<ScoreDimension, DimensionScore>): ScoreBreakdown {
  const toPoints = (dim: ScoreDimension) =>
    dimensions[dim] == null ? null : Math.round((dimensions[dim] as number) * SCORE_WEIGHTS[dim]);
  return {
    seasonality: toPoints("seasonality"),
    wildlifeMatch: toPoints("wildlifeMatch"),
    budgetFit: toPoints("budgetFit"),
    levelFit: toPoints("levelFit"),
    conditionsFit: toPoints("conditionsFit"),
    diveTypeFit: toPoints("diveTypeFit"),
    accessibility: toPoints("accessibility"),
    qualityReviews: toPoints("qualityReviews"),
  };
}

function buildReasonsAndTradeOffs(dimensions: Record<ScoreDimension, DimensionScore>) {
  const reasons: string[] = [];
  const tradeOffs: string[] = [];
  const unknowns: string[] = [];

  (Object.keys(SCORE_WEIGHTS) as ScoreDimension[]).forEach((dim) => {
    const value = dimensions[dim];
    const label = DIMENSION_LABEL[dim];
    if (value == null) {
      unknowns.push(label);
    } else if (value >= 0.7) {
      reasons.push(label);
    } else if (value < 0.5) {
      tradeOffs.push(label);
    }
  });

  return { reasons, tradeOffs, unknowns };
}

/**
 * Scores one destination against one set of search criteria.
 *
 * Contract:
 *  - Applies safety hard filters AND preference filters FIRST. If
 *    `excluded` is true, callers should drop the destination from ranked
 *    results entirely (it is still returned here so callers/tests can
 *    inspect *why*). Safety filters (hardFilters.ts) only exclude on
 *    high-confidence danger; preference filters (preferenceFilters.ts)
 *    exclude once a stated criterion — budget, dive type, conditions,
 *    wildlife — is affirmatively known not to be met.
 *  - Never fabricates a numeric wildlife-sighting probability — dimensions
 *    are qualitative suitability values averaged into a 0-1 fraction, only
 *    ever surfaced as a relative match score, not a probability.
 *  - A dimension with no underlying data is `null` and is excluded from
 *    both matchScore and dataCompletenessPct — see aggregateScore().
 */
export function scoreDestination(
  destination: Destination,
  facts: DestinationScoringFacts,
  criteria: SearchCriteria
): ScoredDestination & { excluded: boolean } {
  const { excluded: unsafe, warnings } = applyHardFilters(facts, criteria);
  const { excluded: mismatched } = applyPreferenceFilters(facts, criteria);
  const excluded = unsafe || mismatched;
  const dimensions = computeDimensions(facts, criteria);
  const { matchScore, dataCompletenessPct } = aggregateScore(dimensions);
  const { reasons, tradeOffs, unknowns } = buildReasonsAndTradeOffs(dimensions);

  return {
    destination,
    matchScore,
    dataCompletenessPct,
    breakdown: toBreakdown(dimensions),
    reasons,
    tradeOffs,
    unknowns,
    hardFilterWarnings: warnings,
    dataConfidence: facts.dataConfidence,
    lastUpdated: facts.lastUpdated,
    excluded,
  };
}

export interface ScoreAllResult {
  ranked: ScoredDestination[];
  excludedCount: number;
  lowDataWarning: boolean;
}

/**
 * Scores and ranks a candidate set of destinations. Excluded destinations
 * — whether for safety (hardFilters.ts) or because a stated criterion is
 * affirmatively not met (preferenceFilters.ts) — are removed from `ranked`
 * but counted in `excludedCount` so the UI can say "N destinations were
 * hidden by your filters". `lowDataWarning` is true when the *average*
 * data completeness across the remaining results is low enough that the
 * ranking should be presented as weak/exploratory rather than
 * authoritative (see §8 "results page must indicate when too much data is
 * missing").
 */
export function scoreAllDestinations(
  entries: { destination: Destination; facts: DestinationScoringFacts }[],
  criteria: SearchCriteria
): ScoreAllResult {
  const scored = entries.map(({ destination, facts }) => scoreDestination(destination, facts, criteria));
  const included = scored.filter((s) => !s.excluded);
  const ranked = [...included].sort((a, b) => b.matchScore - a.matchScore);

  const avgCompleteness =
    ranked.length === 0 ? 0 : ranked.reduce((sum, r) => sum + r.dataCompletenessPct, 0) / ranked.length;

  return {
    ranked,
    excludedCount: scored.length - included.length,
    lowDataWarning: ranked.length > 0 && avgCompleteness < 40,
  };
}
