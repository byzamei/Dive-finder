"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ScoredDestination } from "@/lib/types/domain";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/badges/Badge";
import { ConfidenceBadge, DemoDataBadge } from "@/components/badges/DataBadges";
import { addFavorite } from "@/lib/services/favoriteService";
import { track } from "@/lib/analytics/analytics";

export function ResultCard({
  result,
  position,
  compareSelected,
  onToggleCompare,
  compareDisabled,
}: {
  result: ScoredDestination;
  position: number;
  compareSelected: boolean;
  onToggleCompare: () => void;
  compareDisabled: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const { destination } = result;

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?redirectTo=/results`);
      return;
    }
    await addFavorite(supabase, user.id, "destination", destination.id);
    setSaved(true);
    setSaving(false);
    track({ name: "favorite_added", properties: { entityType: "destination" } });
  }

  return (
    <Card>
      <CardBody>
        <Link
          href={`/destinations/${destination.slug}`}
          onClick={() => track({ name: "result_opened", properties: { destinationSlug: destination.slug, position } })}
          className="focus-ring block"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-display text-lg text-abyss-900">{destination.name}</p>
                {destination.demo_data && <DemoDataBadge />}
              </div>
              {destination.summary ? (
                <p className="mt-1 line-clamp-2 text-sm text-abyss-500">{destination.summary}</p>
              ) : (
                <p className="mt-1 text-sm italic text-abyss-400">No verified summary yet</p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <div className="font-display text-2xl text-ocean-700">{result.matchScore}</div>
              <div className="text-[11px] uppercase tracking-wide text-abyss-400">match</div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone="info">Data completeness {result.dataCompletenessPct}%</Badge>
            <ConfidenceBadge confidence={result.dataConfidence} />
            {destination.dive_type_tags.slice(0, 3).map((tag) => (
              <Badge key={tag} tone="neutral">
                {tag.replace("_", " ")}
              </Badge>
            ))}
          </div>

          {result.reasons.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-seaglass-700">Why it matches</p>
              <ul className="mt-1 list-inside list-disc text-sm text-abyss-700">
                {result.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {result.tradeOffs.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-coral-600">Trade-offs</p>
              <ul className="mt-1 list-inside list-disc text-sm text-abyss-700">
                {result.tradeOffs.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}

          {result.unknowns.length > 0 && (
            <p className="mt-3 text-xs text-abyss-400">
              Unknown for this destination: {result.unknowns.join(", ")}
            </p>
          )}

          {result.hardFilterWarnings.length > 0 && (
            <div className="mt-3 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">
              {result.hardFilterWarnings.map((w) => (
                <p key={w}>{w}</p>
              ))}
            </div>
          )}
        </Link>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || saved}
            className="focus-ring rounded-full border border-abyss-200 px-4 py-2 text-sm font-medium text-abyss-700 hover:bg-abyss-50 disabled:opacity-60"
          >
            {saved ? "Saved" : "Save"}
          </button>
          <label className="focus-ring flex items-center gap-2 rounded-full border border-abyss-200 px-4 py-2 text-sm font-medium text-abyss-700">
            <input
              type="checkbox"
              checked={compareSelected}
              disabled={!compareSelected && compareDisabled}
              onChange={onToggleCompare}
            />
            Compare
          </label>
        </div>
      </CardBody>
    </Card>
  );
}
