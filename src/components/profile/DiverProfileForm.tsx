"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CertificationAgency, Certification, DiverProfile, MarineSpecies } from "@/lib/types/domain";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Chip } from "@/components/discover/Chip";
import { SectionCard, FieldLabel } from "@/components/profile/SectionCard";
import { CURRENT_EXPERIENCE, DIVE_COUNT_BUCKETS, DIVE_TYPE_TAGS } from "@/components/discover/wizardOptions";

const EXPERIENCE_TOGGLES: [keyof DiverProfile, string][] = [
  ["nitrox_certified", "Nitrox certified"],
  ["drift_experience", "Drift diving"],
  ["wreck_experience", "Wreck diving"],
  ["night_experience", "Night diving"],
  ["dry_suit_experience", "Dry suit"],
];

function CertificationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <circle cx="12" cy="8" r="5" />
      <path d="M8.5 12.5 7 21l5-2.5L17 21l-1.5-8.5" />
    </svg>
  );
}

function ExperienceIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5 13 13l-4.5 2.5L11 11l4.5-2.5Z" />
    </svg>
  );
}

function PreferencesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <path d="M12 20s-7-4.35-9.5-8.5C.9 8 2.4 5 5.5 5c1.9 0 3.3 1 4.5 2.5C11.2 6 12.6 5 14.5 5 17.6 5 19.1 8 17.5 11.5 15 15.65 12 20 12 20Z" />
    </svg>
  );
}

export function DiverProfileForm({
  userId,
  initial,
  agencies,
  certifications,
  species,
}: {
  userId: string;
  initial: DiverProfile | null;
  agencies: CertificationAgency[];
  certifications: Certification[];
  species: MarineSpecies[];
}) {
  const [form, setForm] = useState<Partial<DiverProfile>>(
    initial ?? {
      nitrox_certified: false,
      drift_experience: false,
      wreck_experience: false,
      night_experience: false,
      dry_suit_experience: false,
      cave_experience_declared: false,
      species_preferences: [],
      preferred_dive_types: [],
    }
  );
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const certsForAgency = certifications.filter((c) => c.agency_id === form.certification_agency_id);

  function update<K extends keyof DiverProfile>(key: K, value: DiverProfile[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSavedAt(null);
  }

  function toggle<T>(arr: T[] | undefined, value: T): T[] {
    const current = arr ?? [];
    return current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
  }

  async function save() {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("diver_profiles").upsert({ ...form, user_id: userId }, { onConflict: "user_id" });
    setSaving(false);
    setSavedAt(Date.now());
  }

  return (
    <div className="space-y-6">
      <SectionCard icon={<CertificationIcon />} title="Certification" description="Used for safety filters on results">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Agency</FieldLabel>
            <Select
              value={form.certification_agency_id ?? ""}
              onChange={(e) => {
                update("certification_agency_id", e.target.value || (null as never));
                update("certification_id", null as never);
              }}
            >
              <option value="">Certification agency…</option>
              {agencies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <FieldLabel>Certification</FieldLabel>
            <Select
              value={form.certification_id ?? ""}
              onChange={(e) => update("certification_id", e.target.value || (null as never))}
              disabled={!form.certification_agency_id}
            >
              <option value="">Certification…</option>
              {certsForAgency.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={<ExperienceIcon />} title="Experience" description="Helps us match sites to your comfort level">
        <FieldLabel>Number of logged dives</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {DIVE_COUNT_BUCKETS.map((b) => (
            <Chip key={b.value} selected={form.number_of_dives_bucket === b.value} onClick={() => update("number_of_dives_bucket", b.value)}>
              {b.label}
            </Chip>
          ))}
        </div>

        <div className="mt-5">
          <FieldLabel>Comfort in current</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {CURRENT_EXPERIENCE.map((c) => (
              <Chip key={c.value} selected={form.current_experience === c.value} onClick={() => update("current_experience", c.value)}>
                {c.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <FieldLabel>Also experienced with</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_TOGGLES.map(([key, label]) => (
              <Chip key={key} selected={Boolean(form[key])} onClick={() => update(key, !form[key] as never)}>
                {label}
              </Chip>
            ))}
          </div>
        </div>

        <label className="mt-5 flex items-start gap-2.5 rounded-xl2 border border-abyss-100 bg-abyss-50/60 p-3.5 text-sm text-abyss-700">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 accent-ocean-600"
            checked={Boolean(form.cave_experience_declared)}
            onChange={(e) => update("cave_experience_declared", e.target.checked)}
          />
          <span>
            <span className="font-medium">Cave diving experience</span>
            <span className="block text-abyss-500">
              Declared only — never treated as authorization; cave sites always require confirming specific
              certification with the operator.
            </span>
          </span>
        </label>
      </SectionCard>

      <SectionCard icon={<PreferencesIcon />} title="Preferences" description="What you like to see and feel underwater">
        <FieldLabel>Animals you&apos;re usually chasing</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {species.map((s) => (
            <Chip
              key={s.id}
              selected={(form.species_preferences ?? []).includes(s.id)}
              onClick={() => update("species_preferences", toggle(form.species_preferences, s.id))}
            >
              {s.common_name}
            </Chip>
          ))}
        </div>

        <div className="mt-5">
          <FieldLabel>Dive types you prefer</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {DIVE_TYPE_TAGS.map((t) => (
              <Chip
                key={t.value}
                selected={(form.preferred_dive_types ?? []).includes(t.value)}
                onClick={() => update("preferred_dive_types", toggle(form.preferred_dive_types, t.value))}
              >
                {t.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <FieldLabel>Preferred water temperature</FieldLabel>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <input
                type="number"
                aria-label="Min preferred temp (°C)"
                className="focus-ring w-20 rounded-xl2 border border-abyss-200 px-3 py-2 text-sm"
                value={form.preferred_water_temp_min_c ?? ""}
                onChange={(e) => update("preferred_water_temp_min_c", e.target.value ? Number(e.target.value) : (null as never))}
              />
              <span className="text-sm text-abyss-400">°C min</span>
            </div>
            <span className="text-abyss-300">—</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                aria-label="Max preferred temp (°C)"
                className="focus-ring w-20 rounded-xl2 border border-abyss-200 px-3 py-2 text-sm"
                value={form.preferred_water_temp_max_c ?? ""}
                onChange={(e) => update("preferred_water_temp_max_c", e.target.value ? Number(e.target.value) : (null as never))}
              />
              <span className="text-sm text-abyss-400">°C max</span>
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="sticky bottom-[calc(5rem+var(--safe-area-bottom))] z-10 flex items-center gap-3 rounded-xl2 border border-abyss-100 bg-white/95 p-4 shadow-card backdrop-blur md:static md:bottom-auto md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </Button>
        {savedAt && <span className="text-sm text-seaglass-700">Saved ✓</span>}
      </div>
    </div>
  );
}
