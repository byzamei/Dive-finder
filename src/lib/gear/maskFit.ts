import type { FaceProfile, Mask, MaskMatch, Suitability } from "@/lib/types/domain";

/**
 * Matches a (device-measured or manually entered) FaceProfile against the
 * mask catalog. Deliberately mirrors the qualitative-only philosophy of
 * `lib/scoring/`: never a fabricated numeric "% fit" — only
 * excellent/good/possible/low/unknown, always paired with reasons and
 * always with the caveat that this is buying-guide guidance, not a
 * guaranteed seal. See docs/gear-mask-finder.md.
 */
export function matchMask(profile: FaceProfile, mask: Mask): MaskMatch {
  const reasons: string[] = [];

  if (mask.fit_nose_bridge.length === 0 && mask.fit_face_width.length === 0) {
    return {
      mask,
      suitability: "unknown",
      reasons: ["No fit guidance recorded yet for this mask"],
    };
  }

  const noseMatch = mask.fit_nose_bridge.length === 0 || mask.fit_nose_bridge.includes(profile.noseBridge);
  const widthMatch = mask.fit_face_width.length === 0 || mask.fit_face_width.includes(profile.faceWidth);

  if (mask.fit_nose_bridge.includes(profile.noseBridge)) {
    reasons.push(`Commonly recommended for a ${profile.noseBridge} nose bridge`);
  }
  if (mask.fit_face_width.includes(profile.faceWidth)) {
    reasons.push(`Commonly recommended for a ${profile.faceWidth} face width`);
  }

  let suitability: Suitability;
  if (noseMatch && widthMatch && reasons.length === 2) {
    suitability = "excellent";
  } else if (reasons.length > 0) {
    // Not `noseMatch || widthMatch` — either can be vacuously true when a
    // mask simply has no recorded guidance for that dimension (empty
    // array), which must never read as a positive signal on its own. Only
    // a dimension that actually matched pushed a reason, so gating on
    // reasons.length catches the real case this was missing: a mask whose
    // one recorded dimension explicitly contradicts the profile, with the
    // other dimension undocumented, was rating "good" with zero reasons.
    suitability = "good";
  } else {
    suitability = "low";
    reasons.push("Fit guidance for this mask doesn't align with your detected profile");
  }

  return { mask, suitability, reasons };
}

export function matchMasks(profile: FaceProfile, masks: Mask[]): MaskMatch[] {
  const suitabilityRank: Record<Suitability, number> = { excellent: 4, good: 3, possible: 2, low: 1, unknown: 0 };
  return masks
    .map((mask) => matchMask(profile, mask))
    .sort((a, b) => suitabilityRank[b.suitability] - suitabilityRank[a.suitability]);
}
