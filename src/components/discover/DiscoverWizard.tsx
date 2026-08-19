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

const STEPS = ["Dates", "Budget", "Level", "Wildlife", "Conditions", "Review"] as const;

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

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <ol className="mb-8 flex items-center gap-2" aria-label="Progress">
        {STEPS.map((label, i) => (
          <li key={label} className="flex-1">
            <div className={`h-1.5 rounded-full ${i <= step ? "bg-ocean-600" : "bg-abyss-100"}`} />
          </li>
        ))}
      </ol>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ocean-600">
        Step {step + 1} of {STEPS.length} · {STEPS[step]}
      </p>

      <div className="min-h-[280px]">
        {step === 0 && (
          <StepBlock title="When would you like to dive?">
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
            <div className="mt-5">
              <label className="mb-1 block text-sm font-medium text-abyss-700">Trip length (days)</label>
              <input
                type="number"
                min={1}
                className="focus-ring w-32 rounded-lg border border-abyss-200 px-3 py-2 text-sm"
                value={criteria.durationDays ?? ""}
                onChange={(e) => update("durationDays", e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </StepBlock>
        )}

        {step === 1 && (
          <StepBlock title="What's your budget?">
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                placeholder="Total budget"
                className="focus-ring w-40 rounded-lg border border-abyss-200 px-3 py-2 text-sm"
                value={criteria.budgetTotal ?? ""}
                onChange={(e) => update("budgetTotal", e.target.value ? Number(e.target.value) : undefined)}
              />
              <select
                className="focus-ring rounded-lg border border-abyss-200 px-3 py-2 text-sm"
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
            <div className="mt-5">
              <label className="mb-1 block text-sm font-medium text-abyss-700">
                Departure location <span className="text-abyss-400">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Paris, France"
                className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-2 text-sm"
                value={criteria.departureLocation ?? ""}
                onChange={(e) => update("departureLocation", e.target.value)}
              />
            </div>
          </StepBlock>
        )}

        {step === 2 && (
          <StepBlock title="Your level & experience">
            <label className="mb-1 block text-sm font-medium text-abyss-700">Number of logged dives</label>
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
            <label className="mb-1 mt-5 block text-sm font-medium text-abyss-700">Comfort in current</label>
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
            <label className="mt-5 flex items-center gap-2 text-sm text-abyss-700">
              <input
                type="checkbox"
                checked={criteria.nitroxCertified ?? false}
                onChange={(e) => update("nitroxCertified", e.target.checked)}
              />
              Nitrox certified
            </label>
          </StepBlock>
        )}

        {step === 3 && (
          <StepBlock title="Any animals you want to see?">
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
          </StepBlock>
        )}

        {step === 4 && (
          <StepBlock title="Conditions & dive type">
            <label className="mb-1 block text-sm font-medium text-abyss-700">Current you accept</label>
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
            <label className="mb-1 mt-5 block text-sm font-medium text-abyss-700">Dive type</label>
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
            <label className="mt-5 flex items-center gap-2 text-sm text-abyss-700">
              <input
                type="checkbox"
                checked={criteria.photoFriendly ?? false}
                onChange={(e) => update("photoFriendly", e.target.checked)}
              />
              Photo-friendly preferred
            </label>
          </StepBlock>
        )}

        {step === 5 && (
          <StepBlock title="Ready to see results?">
            <SummaryList criteria={criteria} speciesById={new Map(species.map((s) => [s.id, s.common_name]))} />
          </StepBlock>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          Back
        </Button>
        <div className="flex gap-2">
          {!isLast && (
            <Button variant="ghost" onClick={submit}>
              Skip to results
            </Button>
          )}
          {isLast ? (
            <Button onClick={submit}>See results</Button>
          ) : (
            <Button onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>Next</Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="font-display text-2xl text-abyss-900">{title}</h1>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function SummaryList({ criteria, speciesById }: { criteria: SearchCriteria; speciesById: Map<string, string> }) {
  const rows: [string, string][] = [];
  if (criteria.months?.length) rows.push(["Months", criteria.months.map((m) => MONTHS[m - 1]).join(", ")]);
  if (criteria.durationDays) rows.push(["Trip length", `${criteria.durationDays} days`]);
  if (criteria.budgetTotal) rows.push(["Budget", `${criteria.budgetTotal} ${criteria.currency}`]);
  if (criteria.numberOfDivesBucket) rows.push(["Experience", criteria.numberOfDivesBucket]);
  if (criteria.speciesIds?.length)
    rows.push(["Wildlife", criteria.speciesIds.map((id) => speciesById.get(id) ?? id).join(", ")]);
  if (criteria.diveTypes?.length) rows.push(["Dive type", criteria.diveTypes.join(", ")]);
  if (criteria.acceptedCurrent?.length) rows.push(["Accepted current", criteria.acceptedCurrent.join(", ")]);

  if (rows.length === 0) {
    return <p className="text-sm text-abyss-500">No filters set — we&apos;ll show every published destination.</p>;
  }

  return (
    <dl className="divide-y divide-abyss-100 rounded-xl2 border border-abyss-100">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between px-4 py-3 text-sm">
          <dt className="text-abyss-500">{k}</dt>
          <dd className="text-right font-medium text-abyss-900">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
