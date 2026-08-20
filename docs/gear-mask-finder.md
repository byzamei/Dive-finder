# Gear: Mask Finder

An on-device face scan that suggests dive mask shapes suited to your face
— added post-V1 at the product owner's request. Same "never invent a real
fact" and "qualitative, not fabricated-numeric" principles as the rest of
DiveFinder apply here, extended to a new domain (gear) rather than bolted
on as a one-off.

## Privacy — read this before touching the camera code

This feature processes a live camera feed to locate facial landmarks. That
is biometric-adjacent data, so the design constraint is strict:

- **Everything runs on the visitor's own device.** `src/components/gear/FaceScanCamera.tsx`
  attaches the camera stream to a local `<video>` element and runs Google's
  MediaPipe `FaceLandmarker` (via `@mediapipe/tasks-vision`) entirely in
  the browser (WASM). The WASM runtime and the `.task` model file are
  fetched directly by the visitor's browser from Google's CDN — DiveFinder's
  own server is never in that path and never receives a frame.
- **No image, video frame, or raw landmark array is ever sent over the
  network to DiveFinder**, and none of it is written to any DiveFinder
  table. `computeFaceProfile()` (`src/lib/gear/faceMeasurement.ts`) reduces
  478 landmark points down to exactly three category labels
  (`FaceProfile`: `faceWidth` / `noseBridge` / `faceShape`, each one of a
  handful of qualitative values) — that's the only thing that ever leaves
  the camera component.
- **Nothing is persisted by default.** The camera stream is stopped
  (`stream.getTracks().forEach(t => t.stop())`) the instant a profile is
  captured, on cancel, and on unmount. The `FaceProfile` only reaches
  Supabase if the user explicitly taps "Save to my profile" — and even
  then, only the three qualitative labels are written
  (`diver_profiles.mask_face_width/mask_nose_bridge/mask_face_shape`,
  migration `0010_gear.sql`). There is no `images` bucket, no landmark
  table, nothing that could reconstruct a face.
- Users can always skip the camera entirely ("Enter manually instead")
  and pick their profile via chips — same result, zero camera permission
  needed.

## What the scan can and can't honestly measure

A single, uncalibrated phone camera frame has no reference for absolute
size — only ratios between points on the same face are reliable
regardless of how close the phone is held. `faceMeasurement.ts` computes
exactly two scale-independent ratios:

- nose-bridge-width ÷ face-width → `noseBridge` (narrow/medium/wide)
- face-height ÷ face-width → `faceShape` (round/oval/long), from which
  `faceWidth` is derived (see the file header for why it's not a
  separate absolute measurement)

The category thresholds are heuristic estimates, not clinically
validated cutoffs — which is exactly why the product never applies them
silently: `MaskFinderFlow` always shows the detected profile on a
"review" screen with editable chips (`ProfileChips.tsx`) before running
any match, so a wrong guess is one tap to fix.

### Multi-angle capture

`FaceScanCamera.tsx` doesn't stop at one frame. It guides the user through
three captures — center, then turned to each side — and combines them with
`aggregateFaceProfiles()` (majority vote per category field, ties keep the
center capture). This is honest noise reduction, not a claim of finer
precision: several readings agreeing is more trustworthy than trusting
whatever one frame happened to look like, but the underlying math is the
same 2D-ratio heuristic described above, run three times.

`computeYaw()` estimates how far the head is turned from a scale-independent
nose-tip-to-face-edge-midpoint ratio, purely to gate the UI (the capture
button only enables once the current pose is actually held, and the two
"turned" captures must have opposite yaw sign so a user can't just tap
through three identical frontal frames). The sign of yaw is never assumed
to mean a specific physical left/right — the raw camera frame's coordinate
convention isn't something the code relies on being correct in one
particular direction, only that two turns differ from each other.

## Data sourcing for the mask catalog (`masks` table)

Lens type and volume category are published, verifiable product-design
facts. Face-width/nose-bridge fit guidance is **not** available as
structured manufacturer data anywhere public — it's aggregated qualitative
consensus from public buying guides (seeded with one `data_sources` /
`data_claims` row citing the aggregate source, confidence `low`, exactly
the same governance pattern as every other claim in the app — see
docs/data-governance.md). This is why match results are always
`SuitabilityBadge`s (Excellent/Good/Possible/Low/Unknown), never a
fabricated "94% fit" figure, and why every result screen says: this is
buying-guide guidance, not a guaranteed seal — always do a sniff test
before buying.

## Code map

- `src/lib/gear/faceMeasurement.ts` — pure landmark → ratio → category
  math, camera/DOM-free, unit tested.
- `src/lib/gear/maskFit.ts` — pure profile → mask matching, unit tested.
- `src/components/gear/FaceScanCamera.tsx` — the only file that touches
  `getUserMedia`/MediaPipe.
- `src/components/gear/{ProfileChips,MaskMatchCard}.tsx`,
  `MaskFinderFlow.tsx` — UI flow (intro → camera or manual → review/edit →
  results).
- `src/lib/services/gearService.ts` — reads the `masks` table.
- `supabase/migrations/0010_gear.sql` — `masks` table + the three
  qualitative columns on `diver_profiles`.
