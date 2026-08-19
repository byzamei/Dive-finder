"use client";

import type { FaceProfile, FaceShapeCategory, FaceWidthCategory, NoseBridgeCategory } from "@/lib/types/domain";
import { Chip } from "@/components/discover/Chip";

const FACE_WIDTH: { value: FaceWidthCategory; label: string }[] = [
  { value: "narrow", label: "Narrow" },
  { value: "medium", label: "Medium" },
  { value: "wide", label: "Wide" },
];
const NOSE_BRIDGE: { value: NoseBridgeCategory; label: string }[] = [
  { value: "narrow", label: "Narrow" },
  { value: "medium", label: "Medium" },
  { value: "wide", label: "Wide" },
];
const FACE_SHAPE: { value: FaceShapeCategory; label: string }[] = [
  { value: "long", label: "Long" },
  { value: "oval", label: "Oval" },
  { value: "round", label: "Round" },
];

/** Editable chip row per dimension — this is how the user overrides a scanned (or manually started) profile before seeing matches. */
export function ProfileChips({ profile, onChange }: { profile: FaceProfile; onChange: (profile: FaceProfile) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-medium text-abyss-700">Nose bridge width</p>
        <div className="flex flex-wrap gap-2">
          {NOSE_BRIDGE.map((o) => (
            <Chip key={o.value} selected={profile.noseBridge === o.value} onClick={() => onChange({ ...profile, noseBridge: o.value })}>
              {o.label}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-abyss-700">Face width</p>
        <div className="flex flex-wrap gap-2">
          {FACE_WIDTH.map((o) => (
            <Chip key={o.value} selected={profile.faceWidth === o.value} onClick={() => onChange({ ...profile, faceWidth: o.value })}>
              {o.label}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-abyss-700">Face shape</p>
        <div className="flex flex-wrap gap-2">
          {FACE_SHAPE.map((o) => (
            <Chip key={o.value} selected={profile.faceShape === o.value} onClick={() => onChange({ ...profile, faceShape: o.value })}>
              {o.label}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}
