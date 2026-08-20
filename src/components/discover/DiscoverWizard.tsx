"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { MarineSpecies, SearchCriteria } from "@/lib/types/domain";
import { Button } from "@/components/ui/Button";
import { Chip } from "./Chip";
import {
  CURRENCIES,
  CURRENT_EXPERIENCE,
  CURRENT_LEVELS,
  DIVE_COUNT_BUCKETS,
  DIVE_TYPE_TAGS,
  MONTHS,
} from "./wizardOptions";
import { encodeCriteria } from "@/lib/utils/searchParams";
import { track } from "@/lib/analytics/analytics";

const STEPS = [
  {
    label: "Dates",
    title: "When would you like to dive?",
    subtitle: "We match destinations where conditions are verified as good during your window — not just popular picks.",
    icon: CalendarIcon,
  },
  {
    label: "Budget",
    title: "What's your budget?",
    subtitle: "Only destinations with real indicative pricing get scored on this dimension — never a guess.",
    icon: WalletIcon,
  },
  {
    label: "Level",
    title: "Your level & experience",
    subtitle: "Used for safety filters, never to gatekeep — we'll always explain if a site needs more experience.",
    icon: GaugeIcon,
  },
  {
    label: "Wildlife",
    title: "Any animals you want to see?",
    subtitle: "We check verified seasonality data for each pick, not a generic species checklist.",
    icon: FishIcon,
  },
  {
    label: "Conditions",
    title: "Conditions & dive type",
    subtitle: "Tell us what you're comfortable with so mismatches get flagged honestly, not hidden.",
    icon: WavesIcon,
  },
  {
    label: "Review",
    title: "Ready to see results?",
    subtitle: "Everything below feeds your match score — jump back to any step to change it.",
    icon: CheckIcon,
  },
] as const;

export function DiscoverWizard({ initialEntry }: { initialEntry?: string }) {
  const router = useRouter();
  const [step, setStep] = useState(initialEntry === "animal" ? 3 : 0);
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
            {step === 0 && (
              <div>
                <FieldLabel>Months</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {MONTHS.map((m, i) => (
                    <Chip
                      key={m}
                      selected={(criteria.months ?? []).includes(i + 1)}
                      onClick={() => update("months", toggleInArray(criteria.months, i + 1))}
                    >
                      {m}
                    </Chip>
                  ))}
                </div>
                <div className="mt-6">
                  <FieldLabel>Trip length (days)</FieldLabel>
                  <input
                    type="number"
                    min={1}
                    className="focus-ring w-32 rounded-lg border border-abyss-200 px-3 py-2.5 text-sm"
                    value={criteria.durationDays ?? ""}
                    onChange={(e) => update("durationDays", e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <FieldLabel>Total budget</FieldLabel>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 2000"
                    className="focus-ring w-40 rounded-lg border border-abyss-200 px-3 py-2.5 text-sm"
                    value={criteria.budgetTotal ?? ""}
                    onChange={(e) => update("budgetTotal", e.target.value ? Number(e.target.value) : undefined)}
                  />
                  <select
                    className="focus-ring rounded-lg border border-abyss-200 px-3 py-2.5 text-sm"
                    value={criteria.currency ?? "EUR"}
                    onChange={(e) => update("currency", e.target.value)}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-6">
                  <FieldLabel optional>Departure location</FieldLabel>
                  <input
                    type="text"
                    placeholder="e.g. Paris, France"
                    className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-2.5 text-sm"
                    value={criteria.departureLocation ?? ""}
                    onChange={(e) => update("departureLocation", e.target.value)}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <FieldLabel>Number of logged dives</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {DIVE_COUNT_BUCKETS.map((b) => (
                    <Chip
                      key={b.value}
                      selected={criteria.numberOfDivesBucket === b.value}
                      onClick={() => update("numberOfDivesBucket", b.value)}
                    >
                      {b.label}
                    </Chip>
                  ))}
                </div>
                <div className="mt-6">
                  <FieldLabel>Comfort in current</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {CURRENT_EXPERIENCE.map((c) => (
                      <Chip
                        key={c.value}
                        selected={criteria.currentExperience === c.value}
                        onClick={() => update("currentExperience", c.value)}
                      >
                        {c.label}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div className="mt-6">
                  <FieldLabel>Certifications</FieldLabel>
                  <Chip
                    selected={criteria.nitroxCertified ?? false}
                    onClick={() => update("nitroxCertified", !criteria.nitroxCertified)}
                  >
                    Nitrox certified
                  </Chip>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <FieldLabel>Animals you&apos;re chasing</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {species.map((s) => (
                    <Chip
                      key={s.id}
                      selected={(criteria.speciesIds ?? []).includes(s.id)}
                      onClick={() => update("speciesIds", toggleInArray(criteria.speciesIds, s.id))}
                    >
                      {s.common_name}
                    </Chip>
                  ))}
                  {species.length === 0 && <p className="text-sm text-abyss-400">Loading species…</p>}
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <FieldLabel>Current you accept</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {CURRENT_LEVELS.map((c) => (
                    <Chip
                      key={c.value}
                      selected={(criteria.acceptedCurrent ?? []).includes(c.value)}
                      onClick={() => update("acceptedCurrent", toggleInArray(criteria.acceptedCurrent, c.value))}
                    >
                      {c.label}
                    </Chip>
                  ))}
                </div>
                <div className="mt-6">
                  <FieldLabel>Dive type</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {DIVE_TYPE_TAGS.map((t) => (
                      <Chip
                        key={t.value}
                        selected={(criteria.diveTypes ?? []).includes(t.value)}
                        onClick={() => update("diveTypes", toggleInArray(criteria.diveTypes, t.value))}
                      >
                        {t.label}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div className="mt-6">
                  <FieldLabel>Photography</FieldLabel>
                  <Chip
                    selected={criteria.photoFriendly ?? false}
                    onClick={() => update("photoFriendly", !criteria.photoFriendly)}
                  >
                    Photo-friendly preferred
                  </Chip>
                </div>
              </div>
            )}

            {step === 5 && (
              <SummaryList
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

function StepProgress({ step }: { step: number }) {
  return (
    <div>
      <ol className="flex items-center" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s.label} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                i < step
                  ? "bg-ocean-600 text-white"
                  : i === step
                    ? "bg-ocean-600 text-white ring-4 ring-ocean-100"
                    : "bg-abyss-100 text-abyss-400"
              }`}
            >
              {i < step ? <CheckIcon className="h-3.5 w-3.5" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-1.5 h-0.5 flex-1 rounded-full ${i < step ? "bg-ocean-600" : "bg-abyss-100"}`} />
            )}
          </li>
        ))}
      </ol>
      <p className="mt-2.5 text-xs font-medium uppercase tracking-wide text-ocean-600">
        Step {step + 1} of {STEPS.length} · {(STEPS[step] ?? STEPS[0]).label}
      </p>
    </div>
  );
}

function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <label className="mb-2 block text-sm font-medium text-abyss-700">
      {children}
      {optional && <span className="ml-1 font-normal text-abyss-400">(optional)</span>}
    </label>
  );
}

function SummaryList({
  criteria,
  speciesById,
  onEditStep,
}: {
  criteria: SearchCriteria;
  speciesById: Map<string, string>;
  onEditStep: (step: number) => void;
}) {
  const rows: [string, string, number][] = [];
  if (criteria.months?.length) rows.push(["Months", criteria.months.map((m) => MONTHS[m - 1]).join(", "), 0]);
  if (criteria.durationDays) rows.push(["Trip length", `${criteria.durationDays} days`, 0]);
  if (criteria.budgetTotal) rows.push(["Budget", `${criteria.budgetTotal} ${criteria.currency}`, 1]);
  if (criteria.numberOfDivesBucket) rows.push(["Experience", criteria.numberOfDivesBucket, 2]);
  if (criteria.speciesIds?.length)
    rows.push(["Wildlife", criteria.speciesIds.map((id) => speciesById.get(id) ?? id).join(", "), 3]);
  if (criteria.diveTypes?.length) rows.push(["Dive type", criteria.diveTypes.join(", "), 4]);
  if (criteria.acceptedCurrent?.length) rows.push(["Accepted current", criteria.acceptedCurrent.join(", "), 4]);

  if (rows.length === 0) {
    return (
      <p className="rounded-xl2 border border-dashed border-abyss-200 p-4 text-sm text-abyss-500">
        No filters set — we&apos;ll show every published destination. You can still search, or go back and add some.
      </p>
    );
  }

  return (
    <dl className="divide-y divide-abyss-100 overflow-hidden rounded-xl2 border border-abyss-100">
      {rows.map(([k, v, stepIndex]) => (
        <div key={k} className="flex items-center justify-between gap-3 px-4 py-3.5 text-sm">
          <div className="min-w-0">
            <dt className="text-abyss-500">{k}</dt>
            <dd className="mt-0.5 truncate font-medium text-abyss-900">{v}</dd>
          </div>
          <button
            type="button"
            onClick={() => onEditStep(stepIndex)}
            className="focus-ring shrink-0 text-xs font-medium text-ocean-600 underline"
          >
            Edit
          </button>
        </div>
      ))}
    </dl>
  );
}

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <rect x={3} y={5} width={18} height={16} rx={2} />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}
function WalletIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <rect x={3} y={6} width={18} height={13} rx={2} />
      <path d="M3 10h18M15 14h2" />
    </svg>
  );
}
function GaugeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <circle cx={12} cy={12} r={9} />
      <path d="M15.5 8.5 13 13l-4.5 2.5L11 11l4.5-2.5Z" />
    </svg>
  );
}
function FishIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M3 12c3-4 8-6 13-4 2 .8 3.5 2.2 5 4-1.5 1.8-3 3.2-5 4-5 2-10 0-13-4Z" />
      <path d="M17 9.5v5" />
      <circle cx={7.5} cy={11.5} r={0.5} fill="currentColor" />
    </svg>
  );
}
function WavesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M2 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
      <path d="M2 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
      <path d="M2 20c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
    </svg>
  );
}
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} {...props}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}
function ArrowIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
