"use client";

import { useEffect, useRef, useState } from "react";
import { computeFaceProfile, hasRequiredLandmarks } from "@/lib/gear/faceMeasurement";
import type { FaceProfile } from "@/lib/types/domain";
import { Button } from "@/components/ui/Button";

// Canonical, publicly-hosted MediaPipe face landmark model + WASM runtime.
// Both load directly in the visitor's own browser from Google's CDN — this
// app's server is never involved and never sees the camera feed.
const WASM_BASE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

type Status = "loading-model" | "requesting-camera" | "detecting" | "camera-error" | "model-error";

/**
 * Entirely client-side face scan: the video stream is attached to a local
 * <video> element and fed frame-by-frame to an in-browser MediaPipe model.
 * No frame, image, or raw landmark array is ever sent over the network —
 * only the derived FaceProfile (three category labels) is handed back to
 * the caller via onCaptured. Camera tracks are stopped the moment a
 * profile is captured or the component unmounts.
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
      setFaceDetected(Boolean(landmarks && hasRequiredLandmarks(landmarks)));
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

  function capture() {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker) return;
    const result = landmarker.detectForVideo(video, performance.now());
    const landmarks = result.faceLandmarks?.[0];
    if (!landmarks || !hasRequiredLandmarks(landmarks)) return;
    const profile = computeFaceProfile(landmarks, video.videoWidth, video.videoHeight);
    stopCamera();
    onCaptured(profile);
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

  return (
    <div>
      <div className="relative overflow-hidden rounded-xl2 bg-abyss-900">
        <video ref={videoRef} className="aspect-square w-full -scale-x-100 object-cover" muted playsInline />
        {status !== "detecting" && (
          <div className="absolute inset-0 flex items-center justify-center bg-abyss-900/70 text-sm text-white">
            {status === "loading-model" ? "Loading on-device model…" : "Requesting camera access…"}
          </div>
        )}
      </div>
      <p className="mt-3 text-center text-sm text-abyss-500">
        {faceDetected ? "Face detected — center yourself and capture." : "Center your face in the frame."}
      </p>
      <div className="mt-4 flex justify-center gap-3">
        <Button variant="ghost" onClick={cancel}>
          Cancel
        </Button>
        <Button onClick={capture} disabled={!faceDetected}>
          Capture
        </Button>
      </div>
    </div>
  );
}
