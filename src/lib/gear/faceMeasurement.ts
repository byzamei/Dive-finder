import type { FaceProfile, FaceShapeCategory, NoseBridgeCategory } from "@/lib/types/domain";

/**
 * Turns raw face landmarks into a qualitative FaceProfile. Pure and
 * side-effect-free by design — the camera/video plumbing lives in
 * `src/components/gear/FaceScanCamera.tsx`, this file only does geometry,
 * so it's trivially unit-testable without a camera or DOM.
 *
 * Landmark indices follow the standard MediaPipe Face Mesh (468/478-point)
 * topology used by `@mediapipe/tasks-vision` FaceLandmarker:
 *   10  = forehead (upper face boundary, midline)
 *   152 = chin (lower face boundary, midline)
 *   234 = left face edge (subject's right cheek/temple)
 *   454 = right face edge (subject's left cheek/temple)
 *   133 = right eye inner corner
 *   362 = left eye inner corner
 *
 * IMPORTANT — what this can and can't measure honestly:
 * A single uncalibrated camera frame has no reference for absolute size
 * (mm), only RATIOS between points on the same face. That's exactly what
 * we use: nose-bridge-width-to-face-width and face-height-to-face-width
 * are both scale-independent, so they stay valid regardless of how close
 * the phone is held. We do NOT attempt to derive an absolute face width in
 * millimeters — that would need a calibration reference (e.g. a credit
 * card held next to the face), which V1 doesn't implement. `faceWidth` in
 * FaceProfile is therefore derived from the same height/width proportion
 * as `faceShape`, not a separate absolute measurement — see
 * docs/gear-mask-finder.md.
 *
 * The category thresholds below are reasonable heuristic estimates, not
 * clinically validated cutoffs. That's why the product always shows the
 * detected profile before results and lets the user override any of the
 * three categories by hand.
 */

export interface NormalizedLandmark {
  x: number;
  y: number;
}

const LANDMARK = {
  forehead: 10,
  chin: 152,
  faceEdgeRight: 234,
  faceEdgeLeft: 454,
  eyeInnerRight: 133,
  eyeInnerLeft: 362,
} as const;

const REQUIRED_INDICES = Object.values(LANDMARK);

function distance(a: NormalizedLandmark, b: NormalizedLandmark, frameWidth: number, frameHeight: number): number {
  const dx = (a.x - b.x) * frameWidth;
  const dy = (a.y - b.y) * frameHeight;
  return Math.sqrt(dx * dx + dy * dy);
}

export function hasRequiredLandmarks(landmarks: NormalizedLandmark[]): boolean {
  return REQUIRED_INDICES.every((i) => landmarks[i] != null);
}

// Heuristic thresholds — tune here, and see the file header for why these
// are estimates rather than measured constants.
const NOSE_BRIDGE_NARROW_MAX = 0.075;
const NOSE_BRIDGE_WIDE_MIN = 0.095;
const FACE_SHAPE_ROUND_MAX = 1.3;
const FACE_SHAPE_LONG_MIN = 1.5;

export function computeFaceProfile(
  landmarks: NormalizedLandmark[],
  frameWidth: number,
  frameHeight: number
): FaceProfile {
  if (!hasRequiredLandmarks(landmarks)) {
    throw new Error("computeFaceProfile: missing required landmark indices");
  }

  const faceWidthPx = distance(landmarks[LANDMARK.faceEdgeLeft]!, landmarks[LANDMARK.faceEdgeRight]!, frameWidth, frameHeight);
  const faceHeightPx = distance(landmarks[LANDMARK.forehead]!, landmarks[LANDMARK.chin]!, frameWidth, frameHeight);
  const bridgeWidthPx = distance(landmarks[LANDMARK.eyeInnerLeft]!, landmarks[LANDMARK.eyeInnerRight]!, frameWidth, frameHeight);

  const noseBridgeRatio = bridgeWidthPx / faceWidthPx;
  const faceShapeRatio = faceHeightPx / faceWidthPx;

  const noseBridge: NoseBridgeCategory =
    noseBridgeRatio < NOSE_BRIDGE_NARROW_MAX ? "narrow" : noseBridgeRatio > NOSE_BRIDGE_WIDE_MIN ? "wide" : "medium";

  const faceShape: FaceShapeCategory =
    faceShapeRatio < FACE_SHAPE_ROUND_MAX ? "round" : faceShapeRatio > FACE_SHAPE_LONG_MIN ? "long" : "oval";

  // Derived from the same proportion as faceShape, not a separate
  // absolute measurement — see file header.
  const faceWidth = faceShape === "round" ? "wide" : faceShape === "long" ? "narrow" : "medium";

  return { faceWidth, noseBridge, faceShape };
}
