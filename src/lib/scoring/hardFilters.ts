import type { SearchCriteria, NumberOfDivesBucket, CurrentExperience } from "@/lib/types/domain";
import type { DestinationScoringFacts, MinExperienceRequirement } from "./types";

export interface HardFilterResult {
  excluded: boolean;
  warnings: string[];
}

const DIVE_COUNT_MIDPOINT: Record<NumberOfDivesBucket, number> = {
  "0-9": 5,
  "10-24": 17,
  "25-49": 37,
  "50-99": 75,
  "100-249": 175,
  "250+": 300,
};

function approxDiveCount(criteria: SearchCriteria): number | null {
  return criteria.numberOfDivesBucket ? DIVE_COUNT_MIDPOINT[criteria.numberOfDivesBucket] : null;
}

/** True only when the searcher has told us enough to reasonably call them a beginner. */
function isBeginner(criteria: SearchCriteria): boolean {
  const diveCount = approxDiveCount(criteria);
  const experience = criteria.currentExperience;
  if (diveCount == null && !experience) return false; // unknown diver -> never auto-flagged
  const lowDiveCount = diveCount != null && diveCount < 25;
  const lowExperience = experience === "none" || experience === "some";
  // Require at least one concrete signal; if only one is known, use it alone.
  if (diveCount != null && experience) return lowDiveCount && lowExperience;
  if (diveCount != null) return lowDiveCount;
  return lowExperience;
}

function meetsMinExperience(criteria: SearchCriteria, min: MinExperienceRequirement): boolean {
  if (min === "any") return true;
  const diveCount = approxDiveCount(criteria);
  const experience = criteria.currentExperience;
  if (min === "open_water") return true;
  if (min === "advanced") {
    return (diveCount != null && diveCount >= 25) || experience === "comfortable" || experience === "expert";
  }
  // rescue
  return (diveCount != null && diveCount >= 50) && (experience === "comfortable" || experience === "expert");
}

const EXPERIENCE_LABEL: Record<MinExperienceRequirement, string> = {
  any: "any level",
  open_water: "Open Water",
  advanced: "Advanced",
  rescue: "Rescue-level",
};

/**
 * Safety filters run BEFORE scoring (per docs/scoring.md). A destination is
 * only ever hard-excluded when the underlying claim is HIGH confidence —
 * otherwise we surface a non-blocking "check operator requirements"
 * warning instead of pretending to know something we don't.
 *
 * Diver info is optional: if the searcher gave us nothing about their
 * experience, nothing here can trigger (see T007 — anonymous search works).
 */
export function applyHardFilters(
  facts: DestinationScoringFacts,
  criteria: SearchCriteria
): HardFilterResult {
  const warnings: string[] = [];
  let excluded = false;

  if (facts.typicalCurrent === "strong" && isBeginner(criteria)) {
    if (facts.typicalCurrentConfidence === "high") {
      excluded = true;
    } else {
      warnings.push(
        "Conditions here can include strong currents beyond typical beginner comfort — check operator requirements before booking."
      );
    }
  }

  if (facts.safetyRequirement && facts.safetyRequirement.minExperience !== "any") {
    const meets = meetsMinExperience(criteria, facts.safetyRequirement.minExperience);
    if (!meets) {
      const label = EXPERIENCE_LABEL[facts.safetyRequirement.minExperience];
      if (facts.safetyRequirement.confidence === "high") {
        excluded = true;
      } else {
        warnings.push(
          `This destination is often recommended for ${label} divers or above — check operator requirements before booking.`
        );
      }
    }
  }

  if (facts.isCaveSite) {
    // Declared cave experience is never treated as an authorization — always warn.
    warnings.push(
      "Cave diving requires specific cave-diving certification, independent of general experience — confirm credentials directly with the operator."
    );
  }

  return { excluded, warnings };
}

export { isBeginner, meetsMinExperience, approxDiveCount };
