"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Destination } from "@/lib/types/domain";
import { toPins, type MapPin } from "@/lib/services/mapService";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/badges/Badge";
import { DemoDataBadge } from "@/components/badges/DataBadges";
import { ButtonLink } from "@/components/ui/Button";
import { MapView } from "@/components/map/MapView";
import { cn } from "@/lib/utils/cn";

// Destinations, dive sites, and the map used to be three separate top-level
// pages that all browsed the same underlying catalog. This merges
// destinations + map into one page with a List/Map toggle; dive sites and
// wildlife stay one tap away (a destination's own page already lists its
// sites) rather than needing their own equal-weight tab.
interface DestinationRow extends Destination {
  countries: { name: string } | null;
}

export default function ExplorePage() {
  const [destinations, setDestinations] = useState<DestinationRow[] | null>(null);
  const [view, setView] = useState<"list" | "map">("list");
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("destinations")
      .select("*, countries(name)")
      .eq("status", "published")
      .order("name")
      .then(({ data }) => setDestinations((data ?? []) as unknown as DestinationRow[]));
  }, []);

  function toggleCompare(id: string) {
    setCompareIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : ids.length < 4 ? [...ids, id] : ids));
  }

  const pins: MapPin[] = destinations ? toPins(destinations) : [];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-abyss-900">Explore</h1>
          <p className="mt-2 text-abyss-500">Every published destination — browse as a list or on the map.</p>
        </div>
        <div className="flex rounded-full border border-abyss-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn(
              "focus-ring rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              view === "list" ? "bg-abyss-900 text-white" : "text-abyss-600"
            )}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setView("map")}
            className={cn(
              "focus-ring rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              view === "map" ? "bg-abyss-900 text-white" : "text-abyss-600"
            )}
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

      <div className="mt-6">
        {destinations === null ? (
          <p className="text-sm text-abyss-400">Loading…</p>
        ) : view === "map" ? (
          <MapView pins={pins} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {destinations.map((d) => (
              <Card key={d.id}>
                <CardBody>
                  <Link href={`/destinations/${d.slug}`} className="focus-ring block">
                    <div className="flex items-center gap-2">
                      <p className="font-display text-lg text-abyss-900">{d.name}</p>
                      {d.demo_data && <DemoDataBadge />}
                    </div>
                    {d.countries?.name && <p className="mt-0.5 text-sm text-abyss-500">{d.countries.name}</p>}
                    {d.dive_type_tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {d.dive_type_tags.map((t) => (
                          <Badge key={t} tone="neutral">
                            {t.replace("_", " ")}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Link>
                  <label className="focus-ring mt-3 flex w-fit items-center gap-2 text-xs font-medium text-abyss-600">
                    <input
                      type="checkbox"
                      checked={compareIds.includes(d.id)}
                      disabled={!compareIds.includes(d.id) && compareIds.length >= 4}
                      onChange={() => toggleCompare(d.id)}
                    />
                    Compare
                  </label>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-abyss-100 pt-6 text-sm">
        <Link href="/sites" className="focus-ring text-ocean-600 underline">
          Browse individual dive sites →
        </Link>
        <Link href="/wildlife" className="focus-ring text-ocean-600 underline">
          Browse by wildlife →
        </Link>
      </div>
    </main>
  );
}
