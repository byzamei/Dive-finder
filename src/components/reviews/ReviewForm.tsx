"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { createReview } from "@/lib/services/reviewService";
import type { MarineSpecies, Review } from "@/lib/types/domain";
import { StarRatingInput } from "@/components/reviews/StarRating";
import { Chip } from "@/components/discover/Chip";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { VISIBILITY_BUCKETS, CURRENT_LEVELS } from "@/components/discover/wizardOptions";

export function ReviewForm({
  userId,
  entityType,
  entityId,
  species,
  existingReview,
}: {
  userId: string | null;
  entityType: Review["entity_type"];
  entityId: string;
  species: MarineSpecies[];
  existingReview: Review | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [rating, setRating] = useState(0);
  const [diveDate, setDiveDate] = useState("");
  const [visibilityBucket, setVisibilityBucket] = useState("");
  const [currentBucket, setCurrentBucket] = useState("");
  const [waterTempC, setWaterTempC] = useState("");
  const [speciesObserved, setSpeciesObserved] = useState<string[]>([]);
  const [operatorName, setOperatorName] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!userId) {
    return (
      <p className="mt-3 text-sm text-abyss-500">
        <Link href={`/login?redirectTo=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/")}`} className="focus-ring text-ocean-600 underline">
          Sign in
        </Link>{" "}
        to leave a dive report.
      </p>
    );
  }

  if (existingReview || submitted) {
    const status = submitted ? "pending" : existingReview!.status;
    const message = {
      pending: "Your review is submitted and waiting for moderation. Thanks for contributing!",
      published: "Your review is live. Thanks for contributing!",
      rejected: "Your review wasn't published — it didn't meet our community guidelines.",
    }[status];
    return <p className="mt-3 rounded-xl2 border border-abyss-100 bg-abyss-50/60 p-4 text-sm text-abyss-700">{message}</p>;
  }

  function toggleSpecies(id: string) {
    setSpeciesObserved((cur) => (cur.includes(id) ? cur.filter((v) => v !== id) : [...cur, id]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Pick a star rating first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createClient();
      await createReview(supabase, {
        userId: userId!,
        entityType,
        entityId,
        rating,
        diveDate: diveDate || null,
        visibilityBucket: visibilityBucket || null,
        currentBucket: currentBucket || null,
        waterTempC: waterTempC ? Number(waterTempC) : null,
        speciesObserved,
        operatorName: operatorName || null,
        note: note || null,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't submit your review");
    } finally {
      setSubmitting(false);
    }
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="focus-ring mt-4 flex w-full items-center justify-between rounded-xl2 border border-abyss-100 p-4 text-left hover:bg-abyss-50"
      >
        <span className="text-sm font-medium text-abyss-800">Leave a review</span>
        <span aria-hidden className="text-abyss-400">
          ⌄
        </span>
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-4 rounded-xl2 border border-abyss-100 p-4">
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-abyss-400">Your rating</p>
        <StarRatingInput value={rating} onChange={setRating} />
      </div>

      <div>
        <label className="mb-1 block text-xs text-abyss-500" htmlFor="dive_date">
          Dive date
        </label>
        <input
          id="dive_date"
          type="date"
          value={diveDate}
          onChange={(e) => setDiveDate(e.target.value)}
          className="focus-ring w-full max-w-xs rounded-lg border border-abyss-200 px-3 py-2 text-sm"
        />
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

      {species.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs text-abyss-500">Species you saw</p>
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
        <label className="mb-1 block text-xs text-abyss-500" htmlFor="operator_name">
          Operator (optional)
        </label>
        <input
          id="operator_name"
          type="text"
          value={operatorName}
          onChange={(e) => setOperatorName(e.target.value)}
          placeholder="Dive shop or liveaboard name"
          className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-abyss-500" htmlFor="note">
          Your report
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Conditions, highlights, anything future divers should know…"
          className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-coral-600">{error}</p>}

      <Button type="submit" size="sm" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit review"}
      </Button>
      <p className="text-xs text-abyss-400">Reviews are moderated before they appear publicly.</p>
    </form>
  );
}
