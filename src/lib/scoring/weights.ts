// Scoring dimension weights (must sum to 100). Safety/certification is a
// hard filter applied BEFORE scoring — it earns no points here. See
// docs/scoring.md for rationale and worked examples.
export const SCORE_WEIGHTS = {
  seasonality: 20,
  wildlifeMatch: 20,
  budgetFit: 15,
  levelFit: 15,
  conditionsFit: 10,
  diveTypeFit: 10,
  accessibility: 5,
  qualityReviews: 5,
} as const;

export type ScoreDimension = keyof typeof SCORE_WEIGHTS;

export const TOTAL_WEIGHT = Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0);

if (TOTAL_WEIGHT !== 100) {
  throw new Error(`SCORE_WEIGHTS must sum to 100, got ${TOTAL_WEIGHT}`);
}
