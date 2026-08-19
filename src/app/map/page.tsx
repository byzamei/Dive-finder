"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { listPublishedDestinations } from "@/lib/services/destinationService";
import { searchDestinations } from "@/lib/services/recommendationService";
import { toPins, type MapPin } from "@/lib/services/mapService";
import { decodeCriteria } from "@/lib/utils/searchParams";
import { MapView } from "@/components/map/MapView";

function MapInner() {
  const searchParams = useSearchParams();
  const [pins, setPins] = useState<MapPin[] | null>(null);
  const criteriaParam = searchParams.get("c");

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      if (criteriaParam) {
        const criteria = decodeCriteria(criteriaParam);
        const result = await searchDestinations(supabase, criteria);
        setPins(toPins(result.ranked.map((r) => r.destination)));
      } else {
        const destinations = await listPublishedDestinations(supabase);
        setPins(toPins(destinations));
      }
    }
    load();
  }, [criteriaParam]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-display text-3xl text-abyss-900">Map</h1>
      <p className="mt-2 text-abyss-500">
        {criteriaParam ? "Filtered to your search results." : "All published destinations with verified coordinates."}
      </p>
      <div className="mt-6">{pins ? <MapView pins={pins} /> : <p className="text-sm text-abyss-400">Loading…</p>}</div>
    </main>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={null}>
      <MapInner />
    </Suspense>
  );
}
