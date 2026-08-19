import type { SearchCriteria, Suitability } from "@/lib/types/domain";
import type { DestinationScoringFacts } from "./types";

/**
 * Every dimension function returns a number in [0, 1], or `null` when there
 * is not enough data to judge it. `null` is load-bearing: the aggregator in
 * scoringService.ts excludes null dimensions from both the score and the
 * denominator, rather than treating them as 0. See docs/scoring.md.
 */
export type DimensionScore = number | null;

const SUITABILITY_VALUE: Record<Suitability, number | null> = {
  excellent: 1,
  good: 0.75,
  possible: 0.5,
  low: 0.2,
  unknown: null,
};

export function scoreSeasonality(facts: DestinationScoringFacts, criteria: SearchCriteria): DimensionScore {
  const months = criteria.months ?? [];
  if (months.length === 0) return null;

  const knownMonths = months
    .map((m) => facts.monthlyEnvironment[m])
    .filter((env): env is NonNullable<typeof env> => Boolean(env));
  if (knownMonths.length === 0) return null;

  const scores = knownMonths.map((env) => {
    const prefMin = criteria.preferredWaterTempMinC;
    const prefMax = criteria.preferredWaterTempMaxC;
    if (prefMin == null && prefMax == null) return 1; // documented conditions exist, no preference to violate
    if (env.waterTempMinC == null || env.waterTempMaxC == null) return 0.6; // some data, temp unknown
    const lo = prefMin ?? -Infinity;
    const hi = prefMax ?? Infinity;
    const overlaps = env.waterTempMaxC >= lo && env.waterTempMinC <= hi;
    return overlaps ? 1 : 0.25;
  });

  return average(scores);
}

export function scoreWildlifeMatch(facts: DestinationScoringFacts, criteria: SearchCriteria): DimensionScore {
  const speciesIds = criteria.speciesIds ?? [];
  if (speciesIds.length === 0) return null;
  const months = criteria.months ?? [];

  const perSpeciesScores: number[] = [];
  for (const speciesId of speciesIds) {
    const bySpecies = facts.monthlySpeciesSuitability[speciesId];
    if (!bySpecies) continue; // no data at all for this species at this destination

    if (months.length > 0) {
      const monthScores = months
        .map((m) => bySpecies[m])
        .filter((s): s is Suitability => Boolean(s))
        .map((s) => SUITABILITY_VALUE[s])
        .filter((v): v is number => v != null);
      if (monthScores.length > 0) perSpeciesScores.push(average(monthScores));
    } else {
      const anyScores = Object.values(bySpecies)
        .filter((s): s is Suitability => Boolean(s))
        .map((s) => SUITABILITY_VALUE[s])
        .filter((v): v is number => v != null);
      if (anyScores.length > 0) perSpeciesScores.push(average(anyScores));
    }
  }

  if (perSpeciesScores.length === 0) return null;
  return average(perSpeciesScores);
}

export function scoreBudgetFit(facts: DestinationScoringFacts, criteria: SearchCriteria): DimensionScore {
  if (criteria.budgetTotal == null || !facts.indicativeBudget) return null;
  const { amountMin, amountMax } = facts.indicativeBudget;
  if (amountMin == null && amountMax == null) return null;

  const budget = criteria.budgetTotal;
  const lo = amountMin ?? amountMax!;
  const hi = amountMax ?? amountMin!;

  if (budget < lo) {
    const shortfall = (lo - budget) / lo;
    return Math.max(0, 0.4 - shortfall); // under budget for this destination
  }
  if (budget <= hi) return 1;
  const surplus = (budget - hi) / hi;
  return Math.max(0.5, 0.8 - surplus * 0.3); // comfortably above range, still a fine fit
}

export function scoreLevelFit(facts: DestinationScoringFacts, criteria: SearchCriteria): DimensionScore {
  const req = facts.safetyRequirement;
  if (!req || req.minExperience === "any") return null;
  const diveCount = criteria.numberOfDivesBucket;
  const experience = criteria.currentExperience;
  if (!diveCount && !experience) return null;

  const rank: Record<string, number> = { "0-9": 0, "10-24": 1, "25-49": 2, "50-99": 3, "100-249": 4, "250+": 5 };
  const reqRank: Record<string, number> = { open_water: 0, advanced: 2, rescue: 3 };
  const userRank = (diveCount ? rank[diveCount] : 0) ?? 0;
  const needed = reqRank[req.minExperience] ?? 0;

  if (userRank >= needed) return 1;
  const gap = needed - userRank;
  return Math.max(0.2, 1 - gap * 0.3);
}

export function scoreConditionsFit(facts: DestinationScoringFacts, criteria: SearchCriteria): DimensionScore {
  const accepted = criteria.acceptedCurrent ?? [];
  if (accepted.length === 0 || !facts.typicalCurrent) return null;
  return accepted.includes(facts.typicalCurrent) ? 1 : 0.2;
}

export function scoreDiveTypeFit(facts: DestinationScoringFacts, criteria: SearchCriteria): DimensionScore {
  const wanted = criteria.diveTypes ?? [];
  if (wanted.length === 0 || facts.diveTypeTags.length === 0) return null;
  const matches = wanted.filter((t) => facts.diveTypeTags.includes(t)).length;
  return matches / wanted.length;
}

export function scoreAccessibility(): DimensionScore {
  // Out of scope for V1 — no verified travel-time/flight data source
  // (see docs/data-governance.md "Budget" §14). Always unknown, never guessed.
  return null;
}

export function scoreQualityReviews(facts: DestinationScoringFacts): DimensionScore {
  if (facts.reviewsAvgRating == null || facts.reviewsCount === 0) return null;
  return Math.max(0, Math.min(1, facts.reviewsAvgRating / 5));
}

function average(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}
