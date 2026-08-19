"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { listMasks } from "@/lib/services/gearService";
import { matchMasks } from "@/lib/gear/maskFit";
import type { FaceProfile, Mask } from "@/lib/types/domain";
import { Button } from "@/components/ui/Button";
import { FaceScanCamera } from "./FaceScanCamera";
import { ProfileChips } from "./ProfileChips";
import { MaskMatchCard } from "./MaskMatchCard";
import { EmptyState } from "@/components/ui/EmptyState";

type Step = "intro" | "camera" | "review" | "results";

const DEFAULT_PROFILE: FaceProfile = { faceWidth: "medium", noseBridge: "medium", faceShape: "oval" };

export function MaskFinderFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [profile, setProfile] = useState<FaceProfile>(DEFAULT_PROFILE);
  const [scanned, setScanned] = useState(false);
  const [masks, setMasks] = useState<Mask[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (step !== "results") return;
    const supabase = createClient();
    listMasks(supabase).then(setMasks);
  }, [step]);

  async function saveToProfile() {
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login?redirectTo=/gear/mask-finder");
      return;
    }
    await supabase.from("diver_profiles").upsert(
      {
        user_id: user.id,
        mask_face_width: profile.faceWidth,
        mask_nose_bridge: profile.noseBridge,
        mask_face_shape: profile.faceShape,
      },
      { onConflict: "user_id" }
    );
    setSaving(false);
    setSaved(true);
  }

  if (step === "intro") {
    return (
      <div>
        <h1 className="font-display text-2xl text-abyss-900">Mask Finder</h1>
        <p className="mt-2 text-abyss-600">
          Find a mask shape that suits your face — a scuba mask that leaks constantly is usually a fit problem, not a
          technique problem.
        </p>

        <div className="mt-6 rounded-xl2 border border-abyss-100 bg-sand-100 p-4 text-sm text-abyss-600">
          <p className="font-medium text-abyss-800">Your privacy</p>
          <p className="mt-1">
            The camera scan runs entirely on your own device. No photo, video frame, or facial data is ever sent to or
            stored on our servers — only three general category labels (e.g. &quot;narrow nose bridge&quot;) are kept,
            and only if you choose to save them to your profile.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => setStep("camera")}>Scan with camera</Button>
          <Button
            variant="outline"
            onClick={() => {
              setScanned(false);
              setStep("review");
            }}
          >
            Enter manually instead
          </Button>
        </div>
      </div>
    );
  }

  if (step === "camera") {
    return (
      <div>
        <h1 className="font-display text-2xl text-abyss-900">Scanning…</h1>
        <p className="mt-2 text-sm text-abyss-500">Look straight at the camera in good light.</p>
        <div className="mt-4 max-w-sm">
          <FaceScanCamera
            onCaptured={(p) => {
              setProfile(p);
              setScanned(true);
              setStep("review");
            }}
            onCancel={() => {
              setScanned(false);
              setStep("review");
            }}
          />
        </div>
      </div>
    );
  }

  if (step === "review") {
    return (
      <div>
        <h1 className="font-display text-2xl text-abyss-900">Your face profile</h1>
        <p className="mt-2 text-sm text-abyss-500">
          {scanned
            ? "Detected from your scan — adjust anything that doesn't look right before seeing matches."
            : "Not sure? Medium/oval is a reasonable starting point — adjust anything you're confident about."}
        </p>
        <div className="mt-6 max-w-md">
          <ProfileChips profile={profile} onChange={setProfile} />
        </div>
        <div className="mt-6 flex gap-3">
          <Button variant="ghost" onClick={() => setStep("intro")}>
            Back
          </Button>
          <Button onClick={() => setStep("results")}>See matching masks</Button>
        </div>
      </div>
    );
  }

  const results = masks ? matchMasks(profile, masks) : null;

  return (
    <div>
      <h1 className="font-display text-2xl text-abyss-900">Matching masks</h1>
      <p className="mt-1 text-xs text-abyss-400">
        Based on published buying-guide guidance, not manufacturer lab fit data. Always do a sniff test before buying —
        no mask fits every face.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setStep("review")}>
          Adjust profile
        </Button>
        <Button variant="ghost" size="sm" onClick={saveToProfile} disabled={saving || saved}>
          {saved ? "Saved to profile" : saving ? "Saving…" : "Save to my profile"}
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        {results === null && <p className="text-sm text-abyss-400">Loading masks…</p>}
        {results !== null && results.length === 0 && (
          <EmptyState title="No masks in the catalog yet" description="Check back once an admin has added some." />
        )}
        {results?.map((r) => (
          <MaskMatchCard key={r.mask.id} match={r} />
        ))}
      </div>
    </div>
  );
}
