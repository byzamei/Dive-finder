"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Destination, MarineSpecies, Price } from "@/lib/types/domain";
import { listPublishedDestinations } from "@/lib/services/destinationService";
import { ConfidenceBadge, DemoDataBadge } from "@/components/badges/DataBadges";
import { formatBudgetRange } from "@/lib/utils/format";
import { EmptyState } from "@/components/ui/EmptyState";

interface CompareRow {
  destination: Destination;
  species: MarineSpecies[];
  price: Price | null;
}

function CompareInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ids = (searchParams.get("ids") ?? "").split(",").filter(Boolean);
  const [rows, setRows] = useState<CompareRow[] | null>(null);
  const [allDestinations, setAllDestinations] = useState<Destination[]>([]);

  useEffect(() => {
    const supabase = createClient();
    listPublishedDestinations(supabase, { includeDemo: true }).then(setAllDestinations);
  }, []);

  useEffect(() => {
    if (ids.length === 0) {
      setRows([]);
      return;
    }
    const supabase = createClient();
    async function load() {
      const [{ data: destinations }, { data: species }, { data: prices }] = await Promise.all([
        supabase.from("destinations").select("*").in("id", ids),
        supabase.from("destination_species").select("destination_id, marine_species(*)").in("destination_id", ids),
        supabase
          .from("prices")
          .select("*")
          .eq("entity_type", "destination")
          .in("entity_id", ids)
          .or("expires_at.is.null,expires_at.gt." + new Date().toISOString()),
      ]);

      const speciesByDest = new Map<string, MarineSpecies[]>();
      (species as unknown as { destination_id: string; marine_species: MarineSpecies }[] | null)?.forEach((row) => {
        const list = speciesByDest.get(row.destination_id) ?? [];
        list.push(row.marine_species);
        speciesByDest.set(row.destination_id, list);
      });

      const priceByDest = new Map<string, Price>();
      (prices as Price[] | null)?.forEach((p) => priceByDest.set(p.entity_id, p));

      setRows(
        ids
          .map((id) => (destinations as Destination[] | null)?.find((d) => d.id === id))
          .filter((d): d is Destination => Boolean(d))
          .map((destination) => ({
            destination,
            species: speciesByDest.get(destination.id) ?? [],
            price: priceByDest.get(destination.id) ?? null,
          }))
      );
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("ids")]);

  function addDestination(id: string) {
    if (!id || ids.includes(id) || ids.length >= 4) return;
    router.push(`/compare?ids=${[...ids, id].join(",")}`);
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-display text-3xl text-abyss-900">Compare</h1>
      <p className="mt-2 text-abyss-500">Up to 4 destinations side by side.</p>

      {ids.length < 4 && (
        <select
          className="focus-ring mt-4 rounded-lg border border-abyss-200 px-3 py-2 text-sm"
          defaultValue=""
          onChange={(e) => addDestination(e.target.value)}
        >
          <option value="" disabled>
            Add a destination…
          </option>
          {allDestinations
            .filter((d) => !ids.includes(d.id))
            .map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
        </select>
      )}

      {rows && rows.length === 0 && (
        <div className="mt-8">
          <EmptyState title="Nothing to compare yet" description="Add destinations from search results or the picker above." />
        </div>
      )}

      {rows && rows.length > 0 && (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr>
                <th className="text-left text-abyss-400"> </th>
                {rows.map((r) => (
                  <th key={r.destination.id} className="px-3 text-left">
                    <div className="flex items-center gap-1 font-display text-base text-abyss-900">
                      {r.destination.name}
                      {r.destination.demo_data && <DemoDataBadge />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <CompareRowLine
                label="Dive type"
                cells={rows.map((r) => (r.destination.dive_type_tags.length ? r.destination.dive_type_tags.join(", ") : "Unknown"))}
              />
              <CompareRowLine
                label="Wildlife"
                cells={rows.map((r) => (r.species.length ? r.species.map((s) => s.common_name).join(", ") : "Unknown"))}
              />
              <CompareRowLine
                label="Indicative budget"
                cells={rows.map((r) => (r.price ? formatBudgetRange(r.price.amount_min, r.price.amount_max, r.price.currency) : "Unknown"))}
              />
              <tr>
                <td className="px-3 py-2 font-medium text-abyss-500">Data confidence</td>
                {rows.map((r) => (
                  <td key={r.destination.id} className="px-3 py-2">
                    <ConfidenceBadge confidence={r.price ? "medium" : "low"} />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function CompareRowLine({ label, cells }: { label: string; cells: string[] }) {
  return (
    <tr>
      <td className="px-3 py-2 font-medium text-abyss-500">{label}</td>
      {cells.map((c, i) => (
        <td key={i} className="px-3 py-2 text-abyss-800">
          {c}
        </td>
      ))}
    </tr>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={null}>
      <CompareInner />
    </Suspense>
  );
}
