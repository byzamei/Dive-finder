"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createDiveLogEntry, deleteDiveLogEntry, updateDiveLogEntry } from "@/lib/services/diveLogService";
import type { DiveLogEntry, GasType, MarineSpecies, Visibility } from "@/lib/types/domain";
import type { DiveSiteWithDestination } from "@/lib/services/destinationService";
import { Select } from "@/components/ui/Select";
import { Chip } from "@/components/discover/Chip";
import { StarRatingInput } from "@/components/reviews/StarRating";
import { Button } from "@/components/ui/Button";
import { VISIBILITY_BUCKETS, CURRENT_LEVELS } from "@/components/discover/wizardOptions";
import { DivePhotoManager } from "@/components/logbook/DivePhotoManager";

const GAS_TYPES: { value: GasType; label: string }[] = [
  { value: "air", label: "Air" },
  { value: "nitrox", label: "Nitrox" },
  { value: "other", label: "Other" },
];

export function DiveLogForm({
  userId,
  sites,
  species,
  existing,
}: {
  userId: string;
  sites: DiveSiteWithDestination[];
  species: MarineSpecies[];
  existing: DiveLogEntry | null;
}) {
  const router = useRouter();
  const [diveDate, setDiveDate] = useState(existing?.dive_date ?? "");
  const [siteId, setSiteId] = useState(existing?.site_id ?? "");
  const [siteName, setSiteName] = useState(existing?.site_name ?? "");
  const [durationMinutes, setDurationMinutes] = useState(existing?.duration_minutes?.toString() ?? "");
  const [maxDepthM, setMaxDepthM] = useState(existing?.max_depth_m?.toString() ?? "");
  const [avgDepthM, setAvgDepthM] = useState(existing?.avg_depth_m?.toString() ?? "");
  const [waterTempC, setWaterTempC] = useState(existing?.water_temp_c?.toString() ?? "");
  const [visibilityBucket, setVisibilityBucket] = useState(existing?.visibility_bucket ?? "");
  const [currentBucket, setCurrentBucket] = useState(existing?.current_bucket ?? "");
  const [buddyName, setBuddyName] = useState(existing?.buddy_name ?? "");
  const [gasType, setGasType] = useState<GasType | "">(existing?.gas_type ?? "");
  const [nitroxPercentage, setNitroxPercentage] = useState(existing?.nitrox_percentage?.toString() ?? "");
  const [speciesObserved, setSpeciesObserved] = useState<string[]>(existing?.species_observed ?? []);
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [shareVisibility, setShareVisibility] = useState<Visibility>(existing?.visibility ?? "private");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSite = sites.find((s) => s.id === siteId) ?? null;

  function toggleSpecies(id: string) {
    setSpeciesObserved((cur) => (cur.includes(id) ? cur.filter((v) => v !== id) : [...cur, id]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!diveDate) {
      setError("Pick a dive date first.");
      return;
    }
    setSaving(true);
    setError(null);
    const input = {
      diveDate,
      siteId: siteId || null,
      siteName: siteName || null,
      destinationId: selectedSite?.destination_id ?? null,
      durationMinutes: durationMinutes ? Number(durationMinutes) : null,
      maxDepthM: maxDepthM ? Number(maxDepthM) : null,
      avgDepthM: avgDepthM ? Number(avgDepthM) : null,
      waterTempC: waterTempC ? Number(waterTempC) : null,
      visibilityBucket: visibilityBucket || null,
      currentBucket: currentBucket || null,
      buddyName: buddyName || null,
      gasType: gasType || null,
      nitroxPercentage: nitroxPercentage ? Number(nitroxPercentage) : null,
      speciesObserved,
      rating: rating || null,
      notes: notes || null,
      visibility: shareVisibility,
    };
    try {
      const supabase = createClient();
      if (existing) {
        await updateDiveLogEntry(supabase, userId, existing.id, input);
      } else {
        await createDiveLogEntry(supabase, userId, input);
      }
      router.push("/logbook");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save this dive");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!existing) return;
    setDeleting(true);
    const supabase = createClient();
    await deleteDiveLogEntry(supabase, existing.id);
    router.push("/logbook");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="mb-1 block text-xs text-abyss-500" htmlFor="dive_date">
          Dive date *
        </label>
        <input
          id="dive_date"
          type="date"
          required
          value={diveDate}
          onChange={(e) => setDiveDate(e.target.value)}
          className="focus-ring w-full max-w-xs rounded-lg border border-abyss-200 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs text-abyss-500">Your rating</label>
        <StarRatingInput value={rating} onChange={setRating} />
      </div>

      <div>
        <label className="mb-1 block text-xs text-abyss-500">Dive site (from DiveFinder&apos;s catalog)</label>
        <Select value={siteId} onChange={(e) => setSiteId(e.target.value)}>
          <option value="">Not in the catalog / other</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {s.destination_name}
            </option>
          ))}
        </Select>
        <input
          type="text"
          value={siteName}
          onChange={(e) => setSiteName(e.target.value)}
          placeholder="Or type a site name if it's not listed above"
          className="focus-ring mt-2 w-full rounded-lg border border-abyss-200 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs text-abyss-500" htmlFor="duration">
            Duration (min)
          </label>
          <input
            id="duration"
            type="number"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-abyss-500" htmlFor="max_depth">
            Max depth (m)
          </label>
          <input
            id="max_depth"
            type="number"
            value={maxDepthM}
            onChange={(e) => setMaxDepthM(e.target.value)}
            className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-abyss-500" htmlFor="avg_depth">
            Avg depth (m)
          </label>
          <input
            id="avg_depth"
            type="number"
            value={avgDepthM}
            onChange={(e) => setAvgDepthM(e.target.value)}
            className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs text-abyss-500">Visibility</label>
          <Select value={visibilityBucket} onChange={(e) => setVisibilityBucket(e.target.value)}>
            <option value="">Not specified</option>
            {VISIBILITY_BUCKETS.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-abyss-500">Current</label>
          <Select value={currentBucket} onChange={(e) => setCurrentBucket(e.target.value)}>
            <option value="">Not specified</option>
            {CURRENT_LEVELS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-abyss-500" htmlFor="water_temp">
            Water temp (°C)
          </label>
          <input
            id="water_temp"
            type="number"
            value={waterTempC}
            onChange={(e) => setWaterTempC(e.target.value)}
            className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs text-abyss-500">Gas</label>
          <Select value={gasType} onChange={(e) => setGasType(e.target.value as GasType | "")}>
            <option value="">Not specified</option>
            {GAS_TYPES.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </Select>
        </div>
        {gasType === "nitrox" && (
          <div>
            <label className="mb-1 block text-xs text-abyss-500" htmlFor="nitrox_pct">
              Nitrox %
            </label>
            <input
              id="nitrox_pct"
              type="number"
              value={nitroxPercentage}
              onChange={(e) => setNitroxPercentage(e.target.value)}
              className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-2 text-sm"
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs text-abyss-500" htmlFor="buddy">
            Buddy
          </label>
          <input
            id="buddy"
            type="text"
            value={buddyName}
            onChange={(e) => setBuddyName(e.target.value)}
            className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {species.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs text-abyss-500">Species you saw — these get added to your life list</p>
          <div className="flex flex-wrap gap-2">
            {species.map((s) => (
              <Chip key={s.id} selected={speciesObserved.includes(s.id)} onClick={() => toggleSpecies(s.id)}>
                {s.common_name}
              </Chip>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs text-abyss-500" htmlFor="notes">
          Notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded-xl2 border border-abyss-100 bg-sand-100 p-4">
        <label className="mb-1 block text-sm font-medium text-abyss-800">Who can see this dive</label>
        <Select value={shareVisibility} onChange={(e) => setShareVisibility(e.target.value as Visibility)}>
          <option value="private">Private — just you (default)</option>
          <option value="followers">Followers</option>
          <option value="public">Public — anyone</option>
        </Select>
        <p className="mt-1.5 text-xs text-abyss-500">
          Stays private unless you change this. Only this dive is affected — the rest of your logbook keeps its own setting.
        </p>
      </div>

      {existing && <DivePhotoManager userId={userId} entryId={existing.id} />}

      {error && <p className="text-sm text-coral-600">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : existing ? "Save changes" : "Log this dive"}
        </Button>
        {existing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="focus-ring text-sm text-coral-600 underline disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete this entry"}
          </button>
        )}
      </div>
    </form>
  );
}
