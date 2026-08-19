"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CertificationAgency, Certification, DiverProfile, MarineSpecies } from "@/lib/types/domain";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/discover/Chip";
import { CURRENT_EXPERIENCE, DIVE_COUNT_BUCKETS, DIVE_TYPE_TAGS } from "@/components/discover/wizardOptions";

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
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-lg text-abyss-900">Certification</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <select
            className="focus-ring rounded-lg border border-abyss-200 px-3 py-2 text-sm"
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
          </select>
          <select
            className="focus-ring rounded-lg border border-abyss-200 px-3 py-2 text-sm"
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
          </select>
        </div>
      </div>

      <div>
        <h2 className="font-display text-lg text-abyss-900">Experience</h2>
        <p className="mb-2 mt-1 text-sm text-abyss-500">Number of logged dives</p>
        <div className="flex flex-wrap gap-2">
          {DIVE_COUNT_BUCKETS.map((b) => (
            <Chip key={b.value} selected={form.number_of_dives_bucket === b.value} onClick={() => update("number_of_dives_bucket", b.value)}>
              {b.label}
            </Chip>
          ))}
        </div>
        <p className="mb-2 mt-4 text-sm text-abyss-500">Comfort in current</p>
        <div className="flex flex-wrap gap-2">
          {CURRENT_EXPERIENCE.map((c) => (
            <Chip key={c.value} selected={form.current_experience === c.value} onClick={() => update("current_experience", c.value)}>
              {c.label}
            </Chip>
          ))}
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {(
            [
              ["nitrox_certified", "Nitrox certified"],
              ["drift_experience", "Drift diving experience"],
              ["wreck_experience", "Wreck diving experience"],
              ["night_experience", "Night diving experience"],
              ["dry_suit_experience", "Dry suit experience"],
            ] as [keyof DiverProfile, string][]
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm text-abyss-700">
              <input type="checkbox" checked={Boolean(form[key])} onChange={(e) => update(key, e.target.checked as never)} />
              {label}
            </label>
          ))}
        </div>
        <label className="mt-3 flex items-start gap-2 text-sm text-abyss-700">
          <input
            type="checkbox"
            checked={Boolean(form.cave_experience_declared)}
            onChange={(e) => update("cave_experience_declared", e.target.checked)}
          />
          <span>
            Cave diving experience (declared only — never treated as authorization; cave sites always require
            confirming specific certification with the operator)
          </span>
        </label>
      </div>

      <div>
        <h2 className="font-display text-lg text-abyss-900">Preferences</h2>
        <p className="mb-2 mt-1 text-sm text-abyss-500">Animals you&apos;re usually chasing</p>
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
        <p className="mb-2 mt-4 text-sm text-abyss-500">Dive types you prefer</p>
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
        <div className="mt-4 flex items-center gap-3">
          <div>
            <label className="mb-1 block text-xs text-abyss-500">Min preferred temp (°C)</label>
            <input
              type="number"
              className="focus-ring w-28 rounded-lg border border-abyss-200 px-3 py-2 text-sm"
              value={form.preferred_water_temp_min_c ?? ""}
              onChange={(e) => update("preferred_water_temp_min_c", e.target.value ? Number(e.target.value) : (null as never))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-abyss-500">Max preferred temp (°C)</label>
            <input
              type="number"
              className="focus-ring w-28 rounded-lg border border-abyss-200 px-3 py-2 text-sm"
              value={form.preferred_water_temp_max_c ?? ""}
              onChange={(e) => update("preferred_water_temp_max_c", e.target.value ? Number(e.target.value) : (null as never))}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </Button>
        {savedAt && <span className="text-sm text-seaglass-700">Saved</span>}
      </div>
    </div>
  );
}
