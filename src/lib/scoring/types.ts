import type { Confidence, CurrentLevel, DiveTypeTag, Suitability, UUID } from "@/lib/types/domain";

export type MinExperienceRequirement = "any" | "open_water" | "advanced" | "rescue";

export interface SafetyRequirement {
  minExperience: MinExperienceRequirement;
  confidence: Confidence;
}

export interface MonthlyEnvironment {
  waterTempMinC: number | null;
  waterTempMaxC: number | null;
  visibilityMinM: number | null;
  visibilityMaxM: number | null;
}

/**
 * Normalized, pre-joined facts about a destination that the scoring engine
 * needs. Built by `searchService` from Supabase (destinations, data_claims,
 * species_seasonality, environmental_seasonality, prices, reviews). Kept
 * as a plain, DB-independent shape so scoring stays trivially unit-testable
 * with hand-built fixtures — see tests/unit/scoring.test.ts.
 *
 * Every field is nullable/optional on purpose: an absent field means "no
 * verified data", never "assume the worst" or "assume the best". The
 * scoring engine treats null as "exclude this dimension from the score",
 * never as zero.
 */
export interface DestinationScoringFacts {
  destinationId: UUID;
  demoData: boolean;
  /** month (1-12) -> known environmental normals, only when source-backed. */
  monthlyEnvironment: Partial<Record<number, MonthlyEnvironment>>;
  /** speciesId -> month -> qualitative suitability, only when source-backed. */
  monthlySpeciesSuitability: Record<UUID, Partial<Record<number, Suitability>>>;
  /** speciesId of every species with a verified destination_species link — presence only, no calendar required. */
  speciesPresent: UUID[];
  /** Indicative, non-expired price: a destination-level package/day-rate row if one exists, else the cheapest current operator (dive center / liveaboard) price for this destination. */
  indicativeBudget: { amountMin: number | null; amountMax: number | null; currency: string } | null;
  typicalCurrent: CurrentLevel | null;
  typicalCurrentConfidence: Confidence | null;
  safetyRequirement: SafetyRequirement | null;
  isCaveSite: boolean;
  diveTypeTags: DiveTypeTag[];
  reviewsAvgRating: number | null;
  reviewsCount: number;
  /** Rollup confidence across the claims actually used for this destination. */
  dataConfidence: Confidence;
  /** Most recent `verified_at`/`updated_at` among claims used, ISO string. */
  lastUpdated: string | null;
}
