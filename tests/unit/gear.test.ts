import { describe, expect, it } from "vitest";
import {
  aggregateFaceProfiles,
  computeFaceProfile,
  computeYaw,
  hasRequiredLandmarks,
  type NormalizedLandmark,
} from "@/lib/gear/faceMeasurement";
import { matchMask, matchMasks } from "@/lib/gear/maskFit";
import type { FaceProfile, Mask } from "@/lib/types/domain";

function makeLandmarks(overrides: Partial<Record<number, NormalizedLandmark>> = {}): NormalizedLandmark[] {
  const base: NormalizedLandmark[] = new Array(468).fill({ x: 0.5, y: 0.5 });
  // A roughly "oval, medium nose bridge" default face in a 100x100 frame.
  base[10] = { x: 0.5, y: 0.2 }; // forehead
  base[152] = { x: 0.5, y: 0.85 }; // chin
  base[234] = { x: 0.3, y: 0.5 }; // face edge right
  base[454] = { x: 0.7, y: 0.5 }; // face edge left
  base[133] = { x: 0.47, y: 0.45 }; // eye inner right
  base[362] = { x: 0.53, y: 0.45 }; // eye inner left
  base[1] = { x: 0.5, y: 0.5 }; // nose tip, centered by default
  return base.map((lm, i) => overrides[i] ?? lm);
}

function makeMask(overrides: Partial<Mask> = {}): Mask {
  return {
    id: "mask-1",
    slug: "test-mask",
    name: "Test Mask",
    brand: "TestBrand",
    lens_type: "dual",
    volume_category: "medium",
    fit_face_width: [],
    fit_nose_bridge: [],
    notes: null,
    image_url: null,
    demo_data: false,
    status: "published",
    ...overrides,
  };
}

describe("faceMeasurement — pure geometry, no camera/DOM required", () => {
  it("detects missing landmarks rather than crashing silently", () => {
    expect(hasRequiredLandmarks([])).toBe(false);
    expect(hasRequiredLandmarks(makeLandmarks())).toBe(true);
  });

  it("throws a clear error when required landmarks are missing", () => {
    expect(() => computeFaceProfile([], 100, 100)).toThrow(/missing required landmark/i);
  });

  it("classifies a wide-set nose bridge relative to face width as 'wide'", () => {
    const landmarks = makeLandmarks({
      133: { x: 0.4, y: 0.45 },
      362: { x: 0.6, y: 0.45 }, // bridge width 0.2 vs face width 0.4 -> ratio 0.5 (way above wide threshold)
    });
    const profile = computeFaceProfile(landmarks, 100, 100);
    expect(profile.noseBridge).toBe("wide");
  });

  it("classifies a narrow nose bridge relative to face width as 'narrow'", () => {
    const landmarks = makeLandmarks({
      133: { x: 0.495, y: 0.45 },
      362: { x: 0.505, y: 0.45 }, // bridge width 0.01 vs face width 0.4 -> ratio 0.025
    });
    const profile = computeFaceProfile(landmarks, 100, 100);
    expect(profile.noseBridge).toBe("narrow");
  });

  it("classifies a short/wide height:width ratio as round, deriving faceWidth as wide from the same ratio", () => {
    const landmarks = makeLandmarks({
      10: { x: 0.5, y: 0.45 },
      152: { x: 0.5, y: 0.55 }, // height 0.1 vs width 0.4 -> ratio 0.25 (round)
    });
    const profile = computeFaceProfile(landmarks, 100, 100);
    expect(profile.faceShape).toBe("round");
    expect(profile.faceWidth).toBe("wide");
  });

  it("classifies a tall/narrow height:width ratio as long, deriving faceWidth as narrow", () => {
    const landmarks = makeLandmarks({
      10: { x: 0.5, y: 0.05 },
      152: { x: 0.5, y: 0.95 }, // height 0.9 vs width 0.4 -> ratio 2.25 (long)
    });
    const profile = computeFaceProfile(landmarks, 100, 100);
    expect(profile.faceShape).toBe("long");
    expect(profile.faceWidth).toBe("narrow");
  });

  it("ratios are scale-independent — the same proportions at a different frame size classify the same way", () => {
    const landmarks = makeLandmarks();
    const small = computeFaceProfile(landmarks, 50, 50);
    const large = computeFaceProfile(landmarks, 4000, 4000);
    expect(small).toEqual(large);
  });
});

describe("computeYaw — head-turn estimate used to guide multi-angle capture", () => {
  it("reads ~0 when the nose tip is centered between the face edges", () => {
    const landmarks = makeLandmarks({ 1: { x: 0.5, y: 0.5 } });
    expect(Math.abs(computeYaw(landmarks, 100, 100))).toBeLessThan(0.01);
  });

  it("reads a large positive value when the nose shifts toward one face edge", () => {
    const landmarks = makeLandmarks({ 1: { x: 0.62, y: 0.5 } });
    expect(computeYaw(landmarks, 100, 100)).toBeGreaterThan(0.06);
  });

  it("reads a large negative value when the nose shifts toward the other face edge", () => {
    const landmarks = makeLandmarks({ 1: { x: 0.38, y: 0.5 } });
    expect(computeYaw(landmarks, 100, 100)).toBeLessThan(-0.06);
  });
});

describe("aggregateFaceProfiles — combines multi-angle captures without fabricating precision", () => {
  it("returns the single profile unchanged when only one capture exists", () => {
    const profile: FaceProfile = { faceWidth: "narrow", noseBridge: "wide", faceShape: "long" };
    expect(aggregateFaceProfiles([profile])).toEqual(profile);
  });

  it("takes the majority category per field across captures", () => {
    const center: FaceProfile = { faceWidth: "medium", noseBridge: "narrow", faceShape: "oval" };
    const left: FaceProfile = { faceWidth: "medium", noseBridge: "wide", faceShape: "oval" };
    const right: FaceProfile = { faceWidth: "narrow", noseBridge: "narrow", faceShape: "round" };
    // faceWidth: medium,medium,narrow -> medium. noseBridge: narrow,wide,narrow -> narrow.
    // faceShape: oval,oval,round -> oval.
    expect(aggregateFaceProfiles([center, left, right])).toEqual({
      faceWidth: "medium",
      noseBridge: "narrow",
      faceShape: "oval",
    });
  });

  it("breaks a three-way tie by keeping the first (center) capture's value", () => {
    const center: FaceProfile = { faceWidth: "narrow", noseBridge: "medium", faceShape: "oval" };
    const left: FaceProfile = { faceWidth: "medium", noseBridge: "medium", faceShape: "oval" };
    const right: FaceProfile = { faceWidth: "wide", noseBridge: "medium", faceShape: "oval" };
    expect(aggregateFaceProfiles([center, left, right]).faceWidth).toBe("narrow");
  });
});

describe("maskFit — qualitative matching, never a fabricated numeric fit score", () => {
  const narrowProfile: FaceProfile = { faceWidth: "narrow", noseBridge: "narrow", faceShape: "long" };

  it("returns 'unknown' (not 'low') for a mask with no fit data at all", () => {
    const mask = makeMask({ fit_nose_bridge: [], fit_face_width: [] });
    const result = matchMask(narrowProfile, mask);
    expect(result.suitability).toBe("unknown");
  });

  it("returns 'excellent' when both nose bridge and face width match", () => {
    const mask = makeMask({ fit_nose_bridge: ["narrow"], fit_face_width: ["narrow"] });
    const result = matchMask(narrowProfile, mask);
    expect(result.suitability).toBe("excellent");
    expect(result.reasons.length).toBe(2);
  });

  it("returns 'good' when only one dimension matches", () => {
    const mask = makeMask({ fit_nose_bridge: ["narrow"], fit_face_width: ["wide"] });
    const result = matchMask(narrowProfile, mask);
    expect(result.suitability).toBe("good");
  });

  it("returns 'low' (never a numeric score) when neither dimension matches", () => {
    const mask = makeMask({ fit_nose_bridge: ["wide"], fit_face_width: ["wide"] });
    const result = matchMask(narrowProfile, mask);
    expect(result.suitability).toBe("low");
  });

  it("matchMasks ranks excellent/good above low/unknown", () => {
    const excellent = makeMask({ id: "a", fit_nose_bridge: ["narrow"], fit_face_width: ["narrow"] });
    const unknown = makeMask({ id: "b", fit_nose_bridge: [], fit_face_width: [] });
    const low = makeMask({ id: "c", fit_nose_bridge: ["wide"], fit_face_width: ["wide"] });

    const ranked = matchMasks(narrowProfile, [low, unknown, excellent]);
    expect(ranked.map((r) => r.mask.id)).toEqual(["a", "c", "b"]);
  });
});
