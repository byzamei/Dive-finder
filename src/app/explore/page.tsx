"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { MarineSpecies, SearchCriteria } from "@/lib/types/domain";
import { searchDestinations } from "@/lib/services/recommendationService";
import { getCheapestPricePerDestination, type DestinationStartingPrice } from "@/lib/services/operatorService";
import { toPins, type MapPin } from "@/lib/services/mapService";
import { Chip } from "@/components/discover/Chip";
import { MONTHS, CURRENCIES, CURRENT_EXPERIENCE, DIVE_COUNT_BUCKETS, CURRENT_LEVELS, DIVE_TYPE_TAGS } from "@/components/discover/wizardOptions";
import { Badge } from "@/components/badges/Badge";
import { DemoDataBadge } from "@/components/badges/DataBadges";
import { ButtonLink } from "@/components/ui/Button";
import { MapView } from "@/components/map/MapView";
import { cn } from "@/lib/utils/cn";

// Google-Flights-style: filters on the left drive both the list AND the
// map at once, instead of a multi-step form gating a single result. Reuses
// the exact same SearchCriteria/searchDestinations the Search wizard uses
// (never a second, diverging filtering logic) — this page just presents
// every filter flat and always-visible instead of stepped, and skips the
// heavier "why it matches" reasoning in favor of a lighter catalog card.
function formatPrice(price: DestinationStartingPrice): string {
  const symbol: Record<string, string> = { EUR: "€", USD: "$", GBP: "£", AUD: "A$" };
  return `from ${symbol[price.currency] ?? price.currency + " "}${Math.round(price.amountMin)}`;
}

export default function ExplorePage() {
  const [criteria, setCriteria] = useState<SearchCriteria>({ currency: "EUR" });
  const [species, setSpecies] = useState<MarineSpecies[]>([]);
  const [siteCounts, setSiteCounts] = useState<Map<string, number>>(new Map());
  const [countryNames, setCountryNames] = useState<Map<string, string>>(new Map());
  const [prices, setPrices] = useState<Map<string, DestinationStartingPrice>>(new Map());
  const [results, setResults] = useState<Awaited<ReturnType<typeof searchDestinations>> | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [view, setView] = useState<"list" | "map">("list");

  useEffect(() => {
    const supabase = createClient();

    supabase
      .from("marine_species")
      .select("*")
      .order("common_name")
      .then(({ data }) => setSpecies((data ?? []) as MarineSpecies[]));

    supabase
      .from("dive_sites")
      .select("destination_id")
      .eq("status", "published")
      .then(({ data }) => {
        const counts = new Map<string, number>();
        ((data ?? []) as { destination_id: string }[]).forEach((row) => {
          counts.set(row.destination_id, (counts.get(row.destination_id) ?? 0) + 1);
        });
        setSiteCounts(counts);
      });

    async function loadCountriesAndPrices() {
      const { data } = await supabase.from("destinations").select("id, countries(name)").eq("status", "published");
      const rows = (data ?? []) as unknown as { id: string; countries: { name: string } | null }[];

      const map = new Map<string, string>();
      rows.forEach((d) => {
        if (d.countries?.name) map.set(d.id, d.countries.name);
      });
      setCountryNames(map);

      const priceMap = await getCheapestPricePerDestination(supabase, rows.map((d) => d.id));
      setPrices(priceMap);
    }
    loadCountriesAndPrices();
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    searchDestinations(supabase, criteria).then((result) => {
      if (!cancelled) setResults(result);
    });
    return () => {
      cancelled = true;
    };
  }, [criteria]);

  function update<K extends keyof SearchCriteria>(key: K, value: SearchCriteria[K]) {
    setCriteria((c) => ({ ...c, [key]: value }));
  }

  function toggleInArray<T>(arr: T[] | undefined, value: T): T[] {
    const current = arr ?? [];
    return current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
  }

  function toggleCompare(id: string) {
    setCompareIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : ids.length < 4 ? [...ids, id] : ids));
  }

  const ranked = useMemo(() => results?.ranked ?? [], [results]);

  const pins: MapPin[] = useMemo(() => {
    const base = toPins(ranked.map((r) => r.destination));
    return base.map((pin) => {
      const price = prices.get(pin.id);
      return price ? { ...pin, priceLabel: formatPrice(price) } : pin;
    });
  }, [ranked, prices]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="font-display text-3xl text-abyss-900">Explore</h1>
      <p className="mt-2 text-abyss-500">Filter and browse every destination at once — the list and the map stay in sync.</p>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <div className="lg:w-[420px] lg:shrink-0">
          <FiltersPanel
            criteria={criteria}
            species={species}
            update={update}
            toggleInArray={toggleInArray}
          />

          <div className="mt-4 flex items-center justify-between lg:hidden">
            <p className="text-sm font-medium text-abyss-700">
              {results === null ? "Loading…" : `${ranked.length} destination${ranked.length === 1 ? "" : "s"}`}
            </p>
            <div className="flex rounded-full border border-abyss-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setView("list")}
                className={cn("focus-ring rounded-full px-4 py-1.5 text-sm font-medium", view === "list" ? "bg-abyss-900 text-white" : "text-abyss-600")}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => setView("map")}
                className={cn("focus-ring rounded-full px-4 py-1.5 text-sm font-medium", view === "map" ? "bg-abyss-900 text-white" : "text-abyss-600")}
              >
                Map
              </button>
            </div>
          </div>

          {compareIds.length > 0 && (
            <div className="mt-4 flex items-center justify-between rounded-xl2 border border-ocean-200 bg-ocean-50 px-4 py-3">
              <p className="text-sm text-ocean-800">{compareIds.length} selected to compare</p>
              <ButtonLink size="sm" href={`/compare?ids=${compareIds.join(",")}`}>
                Compare
              </ButtonLink>
            </div>
          )}

          <div className={cn("mt-4 space-y-3 lg:max-h-[65vh] lg:overflow-y-auto lg:pr-1", view === "map" && "hidden lg:block")}>
            <p className="hidden text-sm text-abyss-500 lg:block">
              {results === null ? "Loading…" : `${ranked.length} destination${ranked.length === 1 ? "" : "s"} match your filters`}
            </p>
            {results !== null && ranked.length === 0 && (
              <p className="rounded-xl2 border border-dashed border-abyss-200 p-4 text-sm text-abyss-500">
                No destination matches these filters yet. Try widening budget or conditions.
              </p>
            )}
            {ranked.map((r) => {
              const d = r.destination;
              const price = prices.get(d.id);
              return (
                <div key={d.id} className="rounded-xl2 border border-abyss-100 bg-white p-4 shadow-card">
                  <Link href={`/destinations/${d.slug}`} className="focus-ring flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-display text-lg text-abyss-900">{d.name}</p>
                        {d.demo_data && <DemoDataBadge />}
                      </div>
                      {countryNames.get(d.id) && <p className="mt-0.5 text-sm text-abyss-500">{countryNames.get(d.id)}</p>}
                      <p className="mt-1 text-xs text-abyss-400">
                        {siteCounts.get(d.id) ?? 0} dive site{(siteCounts.get(d.id) ?? 0) === 1 ? "" : "s"}
                      </p>
                    </div>
                    {price && <p className="shrink-0 font-display text-lg text-ocean-700">{formatPrice(price)}</p>}
                  </Link>
                  {d.dive_type_tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {d.dive_type_tags.slice(0, 4).map((t) => (
                        <Badge key={t} tone="neutral">
                          {t.replace("_", " ")}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <label className="focus-ring mt-3 flex w-fit items-center gap-2 text-xs font-medium text-abyss-600">
                    <input
                      type="checkbox"
                      checked={compareIds.includes(d.id)}
                      disabled={!compareIds.includes(d.id) && compareIds.length >= 4}
                      onChange={() => toggleCompare(d.id)}
                    />
                    Compare
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        <div className={cn("min-h-[50vh] flex-1 lg:sticky lg:top-20 lg:h-[75vh]", view === "list" && "hidden lg:block")}>
          <MapView pins={pins} />
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-abyss-100 pt-6 text-sm">
        <Link href="/sites" className="focus-ring text-ocean-600 underline">
          Browse individual dive sites →
        </Link>
        <Link href="/wildlife" className="focus-ring text-ocean-600 underline">
          Browse and track wildlife you&apos;ve seen →
        </Link>
      </div>
    </main>
  );
}

function FiltersPanel({
  criteria,
  species,
  update,
  toggleInArray,
}: {
  criteria: SearchCriteria;
  species: MarineSpecies[];
  update: <K extends keyof SearchCriteria>(key: K, value: SearchCriteria[K]) => void;
  toggleInArray: <T>(arr: T[] | undefined, value: T) => T[];
}) {
  return (
    <div className="space-y-4 rounded-xl2 border border-abyss-100 bg-white p-4 shadow-card">
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-abyss-400">Season</p>
        <div className="flex flex-wrap gap-1.5">
          {MONTHS.map((m, i) => (
            <Chip key={m} selected={(criteria.months ?? []).includes(i + 1)} onClick={() => update("months", toggleInArray(criteria.months, i + 1))}>
              {m.slice(0, 3)}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-abyss-400">Budget</p>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            placeholder="e.g. 2000"
            value={criteria.budgetTotal ?? ""}
            onChange={(e) => update("budgetTotal", e.target.value ? Number(e.target.value) : undefined)}
            className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-2 text-sm"
          />
          <select
            value={criteria.currency ?? "EUR"}
            onChange={(e) => update("currency", e.target.value)}
            className="focus-ring rounded-lg border border-abyss-200 px-3 py-2 text-sm"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-abyss-400">Level</p>
        <div className="flex flex-wrap gap-1.5">
          {DIVE_COUNT_BUCKETS.map((b) => (
            <Chip key={b.value} selected={criteria.numberOfDivesBucket === b.value} onClick={() => update("numberOfDivesBucket", b.value)}>
              {b.label}
            </Chip>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {CURRENT_EXPERIENCE.map((c) => (
            <Chip key={c.value} selected={criteria.currentExperience === c.value} onClick={() => update("currentExperience", c.value)}>
              {c.label}
            </Chip>
          ))}
        </div>
      </div>

      <details className="group">
        <summary className="mb-1.5 cursor-pointer text-xs font-semibold uppercase tracking-wide text-abyss-400">
          Wildlife {(criteria.speciesIds ?? []).length > 0 ? `(${criteria.speciesIds!.length})` : ""}
        </summary>
        <div className="mt-2 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
          {species.map((s) => (
            <Chip key={s.id} selected={(criteria.speciesIds ?? []).includes(s.id)} onClick={() => update("speciesIds", toggleInArray(criteria.speciesIds, s.id))}>
              {s.common_name}
            </Chip>
          ))}
        </div>
      </details>

      <details className="group">
        <summary className="mb-1.5 cursor-pointer text-xs font-semibold uppercase tracking-wide text-abyss-400">Conditions</summary>
        <div className="mt-2 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {CURRENT_LEVELS.map((c) => (
              <Chip key={c.value} selected={(criteria.acceptedCurrent ?? []).includes(c.value)} onClick={() => update("acceptedCurrent", toggleInArray(criteria.acceptedCurrent, c.value))}>
                {c.label}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {DIVE_TYPE_TAGS.map((t) => (
              <Chip key={t.value} selected={(criteria.diveTypes ?? []).includes(t.value)} onClick={() => update("diveTypes", toggleInArray(criteria.diveTypes, t.value))}>
                {t.label}
              </Chip>
            ))}
          </div>
          <Chip selected={criteria.photoFriendly ?? false} onClick={() => update("photoFriendly", !criteria.photoFriendly)}>
            Photo-friendly preferred
          </Chip>
        </div>
      </details>
    </div>
  );
}
