import type { DiverProfile, EarnedBadge } from "@/lib/types/domain";

// Deterministic badge engine — same spirit as the scoring engine: every
// badge is earned from an explicit, inspectable rule over data the diver
// actually entered. No hidden thresholds, no randomness, nothing awarded
// server-side out of view.

export interface BadgeInputs {
  diverProfile: Partial<DiverProfile> | null;
  savedCount: number;
  speciesSeenCount: number;
  divesLoggedCount: number;
}

const DIVE_COUNT_RANK: Record<string, number> = {
  "0-9": 0,
  "10-24": 1,
  "25-49": 2,
  "50-99": 3,
  "100-249": 4,
  "250+": 5,
};

export function computeBadges({ diverProfile, savedCount, speciesSeenCount, divesLoggedCount }: BadgeInputs): EarnedBadge[] {
  const badges: EarnedBadge[] = [];
  const p = diverProfile;

  if (p?.number_of_dives_bucket && (DIVE_COUNT_RANK[p.number_of_dives_bucket] ?? 0) >= 4) {
    badges.push({
      id: "veteran",
      label: "Veteran diver",
      description: "100+ logged dives",
    });
  }

  if (p?.nitrox_certified) {
    badges.push({ id: "nitrox", label: "Nitrox certified", description: "Certified for enriched-air diving" });
  }

  if (p?.wreck_experience) {
    badges.push({ id: "wreck", label: "Wreck explorer", description: "Experienced with wreck dives" });
  }

  if (p?.night_experience) {
    badges.push({ id: "night", label: "Night diver", description: "Experienced diving after dark" });
  }

  if (p?.drift_experience) {
    badges.push({ id: "drift", label: "Drift diver", description: "Comfortable in drift conditions" });
  }

  if (p?.dry_suit_experience) {
    badges.push({ id: "dry_suit", label: "Cold-water ready", description: "Dry suit experience" });
  }

  if (p?.cave_experience_declared) {
    badges.push({ id: "cave", label: "Cave diver", description: "Declared cave diving experience" });
  }

  if (savedCount >= 1) {
    badges.push({ id: "planner", label: "Planner", description: "Saved a first destination or site" });
  }
  if (savedCount >= 10) {
    badges.push({ id: "bucket_list", label: "Big dreamer", description: "10+ places saved for later" });
  }

  if (speciesSeenCount >= 1) {
    badges.push({ id: "spotter", label: "Spotter", description: "Logged a first species sighting" });
  }
  if (speciesSeenCount >= 10) {
    badges.push({ id: "naturalist", label: "Naturalist", description: "10+ species personally seen" });
  }
  if (speciesSeenCount >= 25) {
    badges.push({ id: "life_lister", label: "Life lister", description: "25+ species personally seen" });
  }

  if (divesLoggedCount >= 1) {
    badges.push({ id: "logbook_started", label: "Logbook started", description: "Logged a first dive in DiveFinder" });
  }
  if (divesLoggedCount >= 25) {
    badges.push({ id: "dedicated_logger", label: "Dedicated logger", description: "25+ dives logged in DiveFinder" });
  }

  return badges;
}
