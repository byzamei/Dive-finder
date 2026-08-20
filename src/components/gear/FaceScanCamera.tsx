"use client";

import { useEffect, useRef, useState } from "react";
import {
  YAW_CENTER_MAX,
  YAW_TURN_THRESHOLD,
  aggregateFaceProfiles,
  computeFaceProfile,
  computeYaw,
  hasRequiredLandmarks,
} from "@/lib/gear/faceMeasurement";
import type { FaceProfile } from "@/lib/types/domain";
import { Button } from "@/components/ui/Button";

// Canonical, publicly-hosted MediaPipe face landmark model + WASM runtime.
// Both load directly in the visitor's own browser from Google's CDN — this
// app's server is never involved and never sees the camera feed.
const WASM_BASE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

type Status = "loading-model" | "requesting-camera" | "detecting" | "camera-error" | "model-error";

const POSES = [
  { instruction: "Look straight at the camera", hint: "Center your face — hold still" },
  { instruction: "Now turn your head to one side", hint: "Turn a bit more" },
  { instruction: "Now turn your head to the other side", hint: "Turn to the opposite side this time" },
] as const;

/**
 * A guided, multi-angle face scan — three captures (center, then turned to
 * each side) instead of one, combined with aggregateFaceProfiles(). This is
 * entirely client-side: the video stream feeds a local <video> element into
 * an in-browser MediaPipe model. No frame, image, or raw landmark array is
 * ever sent over the network — only the final, aggregated FaceProfile
 * (three category labels) is handed back via onCaptured. Camera tracks stop
 * the moment the scan finishes or the component unmounts.
 *
 * Turning through several angles genuinely helps: it means the result
 * isn't riding on however one single frame happened to look, and the two
 * turned captures are checked to actually differ (opposite yaw sign) so a
 * user can't just tap through three identical frontal frames. It is still
 * a heuristic estimate from 2D landmark ratios, never a claim of clinical
 * or millimeter precision — see docs/gear-mask-finder.md.
 */
export function FaceScanCamera({
  onCaptured,
  onCancel,
}: {
  onCaptured: (profile: FaceProfile) => void;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<import("@mediapipe/tasks-vision").FaceLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);
  const [status, setStatus] = useState<Status>("loading-model");
  const [faceDetected, setFaceDetected] = useState(false);
  const [yaw, setYaw] = useState(0);
  const [poseIndex, setPoseIndex] = useState(0);
  const capturedRef = useRef<{ profile: FaceProfile; yaw: number }[]>([]);

  function stopCamera() {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const vision = await import("@mediapipe/tasks-vision");
        const filesetResolver = await vision.FilesetResolver.forVisionTasks(WASM_BASE_URL);
        const landmarker = await vision.FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
          runningMode: "VIDEO",
          numFaces: 1,
        });
        if (cancelled) return;
        landmarkerRef.current = landmarker;
      } catch {
        if (!cancelled) setStatus("model-error");
        return;
      }

      setStatus("requesting-camera");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        if (!cancelled) setStatus("camera-error");
        return;
      }

      setStatus("detecting");
      loop();
    }

    function loop() {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !landmarker || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      const result = landmarker.detectForVideo(video, performance.now());
      const landmarks = result.faceLandmarks?.[0];
      const detected = Boolean(landmarks && hasRequiredLandmarks(landmarks));
      setFaceDetected(detected);
      if (detected && landmarks) {
        setYaw(computeYaw(landmarks, video.videoWidth, video.videoHeight));
      }
      rafRef.current = requestAnimationFrame(loop);
    }

    init();

    return () => {
      cancelled = true;
      stopCamera();
      landmarkerRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function poseSatisfied(): boolean {
    if (!faceDetected) return false;
    if (poseIndex === 0) return Math.abs(yaw) <= YAW_CENTER_MAX;
    if (Math.abs(yaw) < YAW_TURN_THRESHOLD) return false;
    if (poseIndex === 2) {
      const previousYaw = capturedRef.current[1]?.yaw ?? 0;
      return Math.sign(yaw) !== Math.sign(previousYaw);
    }
    return true;
  }

  function capture() {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker || !poseSatisfied()) return;
    const result = landmarker.detectForVideo(video, performance.now());
    const landmarks = result.faceLandmarks?.[0];
    if (!landmarks || !hasRequiredLandmarks(landmarks)) return;
    const profile = computeFaceProfile(landmarks, video.videoWidth, video.videoHeight);
    const capturedYaw = computeYaw(landmarks, video.videoWidth, video.videoHeight);
    capturedRef.current = [...capturedRef.current, { profile, yaw: capturedYaw }];

    if (capturedRef.current.length >= POSES.length) {
      const aggregated = aggregateFaceProfiles(capturedRef.current.map((c) => c.profile));
      stopCamera();
      onCaptured(aggregated);
      return;
    }
    setPoseIndex((i) => i + 1);
  }

  function cancel() {
    stopCamera();
    onCancel();
  }

  if (status === "model-error" || status === "camera-error") {
    return (
      <div className="rounded-xl2 border border-coral-400/30 bg-coral-400/5 p-5 text-center">
        <p className="font-medium text-abyss-900">
          {status === "camera-error" ? "Camera access was denied or unavailable." : "The face scan couldn't load."}
        </p>
        <p className="mt-1 text-sm text-abyss-500">No problem — you can enter your face profile manually instead.</p>
        <Button variant="outline" className="mt-4" onClick={cancel}>
          Enter manually
        </Button>
      </div>
    );
  }

  const pose = POSES[poseIndex] ?? POSES[0];
  const satisfied = poseSatisfied();

  return (
    <div>
      <div className="mb-3 flex justify-center gap-2">
        {POSES.map((_, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full transition-colors ${
              i < poseIndex ? "bg-ocean-600" : i === poseIndex ? "bg-ocean-400" : "bg-abyss-100"
            }`}
          />
        ))}
      </div>

      <div className="relative overflow-hidden rounded-xl2 bg-abyss-900">
        <video ref={videoRef} className="aspect-square w-full -scale-x-100 object-cover" muted playsInline />
        {status !== "detecting" && (
          <div className="absolute inset-0 flex items-center justify-center bg-abyss-900/70 text-sm text-white">
            {status === "loading-model" ? "Loading on-device model…" : "Requesting camera access…"}
          </div>
        )}
        {status === "detecting" && (
          <div
            className={`pointer-events-none absolute inset-6 rounded-full border-2 transition-colors ${
              satisfied ? "border-seaglass-400" : "border-white/40"
            }`}
          />
        )}
      </div>

      <p className="mt-3 text-center font-medium text-abyss-800">{pose.instruction}</p>
      <p className="mt-1 text-center text-sm text-abyss-500">
        {!faceDetected ? "Center your face in the frame." : satisfied ? "Perfect — capture this angle." : pose.hint}
      </p>

      <div className="mt-4 flex justify-center gap-3">
        <Button variant="ghost" onClick={cancel}>
          Cancel
        </Button>
        <Button onClick={capture} disabled={!satisfied}>
          Capture angle {poseIndex + 1} of {POSES.length}
        </Button>
      </div>
    </div>
  );
}
