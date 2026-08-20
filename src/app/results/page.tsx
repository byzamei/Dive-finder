"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { decodeCriteria } from "@/lib/utils/searchParams";
import { ButtonLink } from "@/components/ui/Button";
import { FilteredExplorer } from "@/components/results/FilteredExplorer";

function ResultsInner() {
  const searchParams = useSearchParams();
  const criteria = decodeCriteria(searchParams.get("c"));

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-abyss-900">Results</h1>
          <p className="mt-1 text-sm text-abyss-500">
            Based on what you told Search — adjust any filter below without redoing the whole questionnaire.
          </p>
        </div>
        <ButtonLink variant="ghost" size="sm" href="/search">
          Start over
        </ButtonLink>
      </div>

      <FilteredExplorer initialCriteria={criteria} />
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
