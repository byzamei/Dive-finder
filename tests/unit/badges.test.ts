import { describe, expect, it } from "vitest";
import { computeBadges } from "@/lib/profile/badges";
import type { DiverProfile } from "@/lib/types/domain";

function ids(badges: { id: string }[]): string[] {
  return badges.map((b) => b.id);
}

describe("computeBadges", () => {
  it("awards nothing for an empty profile with no activity", () => {
    const badges = computeBadges({ diverProfile: null, savedCount: 0, speciesSeenCount: 0 });
    expect(badges).toEqual([]);
  });

  it("awards experience badges directly from declared boolean flags", () => {
    const diverProfile: Partial<DiverProfile> = {
      nitrox_certified: true,
      wreck_experience: true,
      night_experience: false,
    };
    const badges = computeBadges({ diverProfile, savedCount: 0, speciesSeenCount: 0 });
    expect(ids(badges)).toEqual(expect.arrayContaining(["nitrox", "wreck"]));
    expect(ids(badges)).not.toContain("night");
  });

  it("awards the veteran badge only at 100+ dives, not below", () => {
    const under = computeBadges({
      diverProfile: { number_of_dives_bucket: "50-99" },
      savedCount: 0,
      speciesSeenCount: 0,
    });
    const over = computeBadges({
      diverProfile: { number_of_dives_bucket: "100-249" },
      savedCount: 0,
      speciesSeenCount: 0,
    });
    expect(ids(under)).not.toContain("veteran");
    expect(ids(over)).toContain("veteran");
  });

  it("tiers saved-list badges at 1 and 10", () => {
    expect(ids(computeBadges({ diverProfile: null, savedCount: 0, speciesSeenCount: 0 }))).not.toContain("planner");
    expect(ids(computeBadges({ diverProfile: null, savedCount: 1, speciesSeenCount: 0 }))).toEqual(["planner"]);
    const badges = computeBadges({ diverProfile: null, savedCount: 10, speciesSeenCount: 0 });
    expect(ids(badges)).toEqual(expect.arrayContaining(["planner", "bucket_list"]));
  });

  it("tiers species life-list badges at 1, 10, and 25", () => {
    expect(ids(computeBadges({ diverProfile: null, savedCount: 0, speciesSeenCount: 5 }))).toEqual(["spotter"]);
    expect(ids(computeBadges({ diverProfile: null, savedCount: 0, speciesSeenCount: 10 }))).toEqual(
      expect.arrayContaining(["spotter", "naturalist"])
    );
    const all = computeBadges({ diverProfile: null, savedCount: 0, speciesSeenCount: 25 });
    expect(ids(all)).toEqual(expect.arrayContaining(["spotter", "naturalist", "life_lister"]));
  });
});
