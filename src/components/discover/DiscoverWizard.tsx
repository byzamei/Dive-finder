"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { MarineSpecies, SearchCriteria } from "@/lib/types/domain";
import { Button } from "@/components/ui/Button";
import { encodeCriteria } from "@/lib/utils/searchParams";
import { track } from "@/lib/analytics/analytics";
import { SearchInspiration } from "./SearchInspiration";
import { StepProgress } from "./StepProgress";
import { ArrowIcon } from "./WizardIcons";
import { STEPS } from "./wizardSteps";
import { DatesFields } from "./steps/DatesFields";
import { BudgetStep } from "./steps/BudgetStep";
import { LevelStep } from "./steps/LevelStep";
import { WildlifeStep } from "./steps/WildlifeStep";
import { ConditionsStep } from "./steps/ConditionsStep";
import { SummaryStep } from "./steps/SummaryStep";

export function DiscoverWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [criteria, setCriteria] = useState<SearchCriteria>({ currency: "EUR" });
  const [species, setSpecies] = useState<MarineSpecies[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("marine_species")
      .select("*")
      .order("common_name")
      .then(({ data }) => setSpecies((data ?? []) as MarineSpecies[]));
  }, []);

  // The Profile page promises the saved diver profile "personalizes search
  // results" — this is what makes that true, instead of it silently never
  // happening. Only fills in fields the wizard doesn't already have an
  // answer for (functional update, checked against the latest state), so a
  // fast typist who starts answering before this resolves never has a
  // fresh choice overwritten by a stale saved default.
  useEffect(() => {
    const supabase = createClient();
    async function prefillFromDiverProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: diverProfile } = await supabase
        .from("diver_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!diverProfile) return;

      setCriteria((c) => ({
        ...c,
        numberOfDivesBucket: c.numberOfDivesBucket ?? diverProfile.number_of_dives_bucket ?? undefined,
        currentExperience: c.currentExperience ?? diverProfile.current_experience ?? undefined,
        nitroxCertified: c.nitroxCertified ?? diverProfile.nitrox_certified,
        certificationId: c.certificationId ?? diverProfile.certification_id ?? undefined,
        certificationAgencyId: c.certificationAgencyId ?? diverProfile.certification_agency_id ?? undefined,
        speciesIds: c.speciesIds?.length
          ? c.speciesIds
          : diverProfile.species_preferences?.length
            ? diverProfile.species_preferences
            : c.speciesIds,
        preferredWaterTempMinC: c.preferredWaterTempMinC ?? diverProfile.preferred_water_temp_min_c ?? undefined,
        preferredWaterTempMaxC: c.preferredWaterTempMaxC ?? diverProfile.preferred_water_temp_max_c ?? undefined,
        diveTypes: c.diveTypes?.length
          ? c.diveTypes
          : diverProfile.preferred_dive_types?.length
            ? diverProfile.preferred_dive_types
            : c.diveTypes,
        caveDeclared: c.caveDeclared ?? diverProfile.cave_experience_declared,
      }));
    }
    prefillFromDiverProfile();
  }, []);

  function update<K extends keyof SearchCriteria>(key: K, value: SearchCriteria[K]) {
    setCriteria((c) => ({ ...c, [key]: value }));
  }

  function toggleInArray<T>(arr: T[] | undefined, value: T): T[] {
    const current = arr ?? [];
    return current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
  }

  function submit() {
    track({
      name: "search_started",
      properties: {
        has_dates: Boolean(criteria.months?.length),
        has_species: Boolean(criteria.speciesIds?.length),
      },
    });
    router.push(`/results?c=${encodeCriteria(criteria)}`);
  }

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step] ?? STEPS[0];
  const Icon = current.icon;

  if (step === 0) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mx-auto max-w-2xl">
          <StepProgress step={step} />

          {/* A tight search box, Booking-style — only the actual question
              lives in a bordered card. Inspiration content below is full
              width, not boxed, so the CTA reads as "the form," not one
              card among several. */}
          <div className="mt-6 rounded-xl2 border-2 border-ocean-200 bg-white p-5 shadow-lg sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ocean-50 text-ocean-600">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-display text-xl text-abyss-900">{current.title}</h1>
                <p className="mt-1 text-sm text-abyss-500">{current.subtitle}</p>
              </div>
            </div>

            <div className="mt-5">
              <DatesFields criteria={criteria} update={update} toggleInArray={toggleInArray} />
            </div>

            <div className="mt-5 flex items-center gap-4 border-t border-abyss-100 pt-4">
              <Button onClick={() => setStep(1)} className="flex-1 justify-center">
                Next
                <ArrowIcon className="h-4 w-4" />
              </Button>
              <button type="button" onClick={submit} className="focus-ring shrink-0 text-sm text-abyss-500 underline">
                Skip to results
              </button>
            </div>
          </div>
        </div>

        <SearchInspiration />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <StepProgress step={step} />

      <div className="mt-6 overflow-hidden rounded-xl2 border border-abyss-100 bg-white shadow-card">
        <div key={step} className="animate-step-in p-6 sm:p-8">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ocean-50 text-ocean-600">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl text-abyss-900">{current.title}</h1>
              <p className="mt-1 text-sm text-abyss-500">{current.subtitle}</p>
            </div>
          </div>

          <div className="mt-6 min-h-[220px]">
            {step === 1 && <BudgetStep criteria={criteria} update={update} />}
            {step === 2 && <LevelStep criteria={criteria} update={update} />}
            {step === 3 && (
              <WildlifeStep criteria={criteria} species={species} update={update} toggleInArray={toggleInArray} />
            )}
            {step === 4 && <ConditionsStep criteria={criteria} update={update} toggleInArray={toggleInArray} />}
            {step === 5 && (
              <SummaryStep
                criteria={criteria}
                speciesById={new Map(species.map((s) => [s.id, s.common_name]))}
                onEditStep={setStep}
              />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-abyss-100 bg-abyss-50/40 px-6 py-4 sm:px-8">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            Back
          </Button>
          <div className="flex items-center gap-3">
            {!isLast && (
              <button type="button" onClick={submit} className="focus-ring text-sm text-abyss-500 underline">
                Skip to results
              </button>
            )}
            {isLast ? (
              <Button onClick={submit}>See results</Button>
            ) : (
              <Button onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
                Next
                <ArrowIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
