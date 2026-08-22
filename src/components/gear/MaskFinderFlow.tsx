"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { listMasks } from "@/lib/services/gearService";
import { matchMasks } from "@/lib/gear/maskFit";
import { MASK_CONCERN_OPTIONS, getConcernAdvice } from "@/lib/gear/maskConcerns";
import type { FaceProfile, Mask, MaskFitConcern } from "@/lib/types/domain";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/discover/Chip";
import { FaceScanCamera } from "./FaceScanCamera";
import { ProfileChips } from "./ProfileChips";
import { MaskMatchCard } from "./MaskMatchCard";
import { EmptyState } from "@/components/ui/EmptyState";

type Step = "intro" | "camera" | "review" | "concerns" | "results";

const DEFAULT_PROFILE: FaceProfile = { faceWidth: "medium", noseBridge: "medium", faceShape: "oval" };

export function MaskFinderFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [profile, setProfile] = useState<FaceProfile>(DEFAULT_PROFILE);
  const [scanned, setScanned] = useState(false);
  const [concerns, setConcerns] = useState<MaskFitConcern[]>([]);
  const [masks, setMasks] = useState<Mask[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (step !== "results") return;
    const supabase = createClient();
    listMasks(supabase).then(setMasks);
  }, [step]);

  async function saveToProfile() {
    setSaving(true);
    setSaveError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      router.push("/login?redirectTo=/gear/mask-finder");
      return;
    }
    const { error } = await supabase.from("diver_profiles").upsert(
      {
        user_id: user.id,
        mask_face_width: profile.faceWidth,
        mask_nose_bridge: profile.noseBridge,
        mask_face_shape: profile.faceShape,
        mask_fit_concerns: concerns,
      },
      { onConflict: "user_id" }
    );
    setSaving(false);
    if (error) {
      setSaveError(error.message);
    } else {
      setSaved(true);
    }
  }

  if (step === "intro") {
    return (
      <div>
        <h1 className="font-display text-2xl text-abyss-900">Mask Finder</h1>
        <p className="mt-2 text-abyss-600">
          Find a mask shape that suits your face — a scuba mask that leaks constantly is usually a fit problem, not a
          technique problem. The scan captures three angles (center and both sides) so the result isn&apos;t riding
          on one lucky frame.
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
        <p className="mt-2 text-sm text-abyss-500">
          We&apos;ll guide you through three quick angles — good light helps.
        </p>
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
          <Button onClick={() => setStep("concerns")}>Continue</Button>
        </div>
      </div>
    );
  }

  if (step === "concerns") {
    function toggleConcern(value: MaskFitConcern) {
      setConcerns((c) => (c.includes(value) ? c.filter((v) => v !== value) : [...c, value]));
    }
    return (
      <div>
        <h1 className="font-display text-2xl text-abyss-900">Any recurring problems with masks?</h1>
        <p className="mt-2 text-sm text-abyss-500">
          Optional — this won&apos;t change your face profile, but we&apos;ll show relevant tips alongside your
          matches. Pick as many as apply.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {MASK_CONCERN_OPTIONS.map((o) => (
            <Chip key={o.value} selected={concerns.includes(o.value)} onClick={() => toggleConcern(o.value)}>
              {o.label}
            </Chip>
          ))}
        </div>
        <div className="mt-6 flex gap-3">
          <Button variant="ghost" onClick={() => setStep("review")}>
            Back
          </Button>
          <Button onClick={() => setStep("results")}>See matching masks</Button>
        </div>
      </div>
    );
  }

  const results = masks ? matchMasks(profile, masks) : null;
  const advice = getConcernAdvice(concerns);

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
        <Button variant="outline" size="sm" onClick={() => setStep("concerns")}>
          Adjust concerns
        </Button>
        <Button variant="ghost" size="sm" onClick={saveToProfile} disabled={saving || saved}>
          {saved ? "Saved to profile" : saving ? "Saving…" : "Save to my profile"}
        </Button>
        {saveError && <span className="self-center text-sm text-coral-600">{saveError}</span>}
      </div>

      {advice.length > 0 && (
        <div className="mt-6 rounded-xl2 border border-seaglass-200 bg-seaglass-50 p-4">
          <p className="font-medium text-seaglass-800">Tips based on what you told us</p>
          <p className="mt-1 text-xs text-seaglass-700">
            General fitting/technique guidance, not a claim about any specific mask below.
          </p>
          <div className="mt-3 space-y-3">
            {advice.map((a) => (
              <div key={a.concern}>
                <p className="text-sm font-medium text-abyss-800">{a.label}</p>
                <ul className="mt-1 list-inside list-disc text-sm text-abyss-600">
                  {a.tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

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
