"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { searchDestinations } from "@/lib/services/recommendationService";
import type { ScoredDestination } from "@/lib/types/domain";
import { decodeCriteria } from "@/lib/utils/searchParams";
import { ResultCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ResultCard } from "@/components/cards/ResultCard";
import { Button, ButtonLink } from "@/components/ui/Button";
import { track } from "@/lib/analytics/analytics";

function ResultsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [results, setResults] = useState<ScoredDestination[] | null>(null);
  const [excludedCount, setExcludedCount] = useState(0);
  const [lowDataWarning, setLowDataWarning] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const criteria = decodeCriteria(searchParams.get("c"));

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();
    const supabase = createClient();

    searchDestinations(supabase, criteria)
      .then((result) => {
        if (cancelled) return;
        setResults(result.ranked);
        setExcludedCount(result.excludedCount);
        setLowDataWarning(result.lowDataWarning);
        track({ name: "search_completed", properties: { resultCount: result.ranked.length, durationMs: Date.now() - startedAt } });
        track({
          name: "results_returned",
          properties: {
            resultCount: result.ranked.length,
            avgDataCompleteness:
              result.ranked.length === 0
                ? 0
                : Math.round(result.ranked.reduce((s, r) => s + r.dataCompletenessPct, 0) / result.ranked.length),
          },
        });
        if (result.ranked.length === 0) track({ name: "no_results" });
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Search failed");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("c")]);

  function toggleCompare(id: string) {
    setCompareIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : ids.length < 4 ? [...ids, id] : ids));
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-abyss-900">Results</h1>
        <Button variant="ghost" size="sm" onClick={() => router.push("/discover")}>
          Refine search
        </Button>
      </div>

      {lowDataWarning && (
        <div className="mb-6 rounded-xl2 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Data coverage for your criteria is currently limited — rankings below should be treated as
          exploratory rather than definitive. Check each destination&apos;s data completeness score.
        </div>
      )}

      {excludedCount > 0 && (
        <p className="mb-4 text-xs text-abyss-500">
          {excludedCount} destination{excludedCount > 1 ? "s were" : " was"} hidden for safety reasons based on
          your experience level.
        </p>
      )}

      {error && <p className="text-sm text-coral-600">{error}</p>}

      {results === null && !error && (
        <div className="space-y-4">
          <ResultCardSkeleton />
          <ResultCardSkeleton />
          <ResultCardSkeleton />
        </div>
      )}

      {results !== null && results.length === 0 && (
        <EmptyState
          title="No destinations match yet"
          description="Try widening your budget, accepted conditions, or removing a filter. You can also browse all destinations directly."
          action={<ButtonLink href="/discover">Adjust search</ButtonLink>}
        />
      )}

      {results !== null && results.length > 0 && (
        <div className="space-y-4">
          {results.map((r, i) => (
            <ResultCard
              key={r.destination.id}
              result={r}
              position={i}
              compareSelected={compareIds.includes(r.destination.id)}
              compareDisabled={compareIds.length >= 4}
              onToggleCompare={() => toggleCompare(r.destination.id)}
            />
          ))}
        </div>
      )}

      {compareIds.length >= 2 && (
        <div className="fixed inset-x-0 bottom-20 z-30 flex justify-center px-6 md:bottom-6">
          <ButtonLink
            href={`/compare?ids=${compareIds.join(",")}`}
            variant="secondary"
            onClick={() => track({ name: "compare_used", properties: { count: compareIds.length } })}
          >
            Compare {compareIds.length} destinations
          </ButtonLink>
        </div>
      )}
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={null}>
      <ResultsInner />
    </Suspense>
  );
}
