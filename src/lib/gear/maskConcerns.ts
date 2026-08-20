import type { MaskFitConcern } from "@/lib/types/domain";

/**
 * Recurring mask-fit problems, and general (non-mask-specific) tips for
 * each. Deliberately separate from the sourced `masks` catalog and from
 * `maskFit.ts`'s matching logic — these are widely known fitting/technique
 * tips, not a verified claim about any particular mask, and are never
 * merged into per-mask suitability reasoning. See docs/gear-mask-finder.md.
 */

export const MASK_CONCERN_OPTIONS: { value: MaskFitConcern; label: string }[] = [
  { value: "leaks", label: "Water keeps getting in" },
  { value: "fogs", label: "Fogs up" },
  { value: "nose_pain", label: "Nose bridge hurts" },
  { value: "too_tight", label: "Feels too tight" },
  { value: "too_loose", label: "Doesn't seal on the cheeks" },
  { value: "facial_hair", label: "Facial hair breaks the seal" },
  { value: "hard_to_equalize", label: "Hard to pinch my nose to equalize" },
];

export interface ConcernAdvice {
  concern: MaskFitConcern;
  label: string;
  tips: string[];
}

const ADVICE: Record<MaskFitConcern, string[]> = {
  leaks: [
    "Stray hair or facial hair along the seal line is the most common cause of leaks — trim close to the skirt or reposition the strap.",
    "Run a finger around the inside edge before diving to check the skirt sits flat against your skin, not folded or twisted.",
    "A skirt that's aged, hardened, or lost its flexibility loses its seal regardless of fit — that's a wear issue, not a sizing one.",
  ],
  fogs: [
    "New masks have manufacturing residue on the lens that causes fogging until removed — scrub with toothpaste or a dedicated defog product before first use.",
    "Defog needs reapplying most dives; a single treatment doesn't last.",
    "A lower-volume mask traps less air against the lens, which tends to fog less — worth factoring in alongside fit.",
  ],
  nose_pain: [
    "Pain across the bridge usually means the frame is narrower than your nose — masks marked as fitting a 'wide' nose bridge below are worth prioritizing.",
    "Over-tightening the strap doesn't improve the seal and adds pressure — it should sit snug, not cranked down.",
  ],
  too_tight: [
    "Constant pressure at the temples usually means the frame is narrower than your face — masks marked 'wide' face width below are worth prioritizing.",
    "Loosen the strap and let the skirt's own seal do the work; a properly fitted mask stays on with light tension.",
  ],
  too_loose: [
    "A gap along the cheeks with the strap already snug usually means the mask is wider than your face — masks marked 'narrow' face width below are worth prioritizing.",
  ],
  facial_hair: [
    "Silicone skirts don't seal reliably over hair regardless of mask shape — trimming along the seal line helps most.",
    "Double-edge skirts tend to be a little more forgiving over light stubble than a single edge.",
  ],
  hard_to_equalize: [
    "If you can't comfortably reach your nose inside the mask, that's specific to the nose pocket's shape and size — try the mask in person before buying if you can.",
    "This is unrelated to face width or nose-bridge fit, so it won't show up in the matches below.",
  ],
};

export function getConcernAdvice(concerns: MaskFitConcern[]): ConcernAdvice[] {
  return MASK_CONCERN_OPTIONS.filter((o) => concerns.includes(o.value)).map((o) => ({
    concern: o.value,
    label: o.label,
    tips: ADVICE[o.value],
  }));
}
