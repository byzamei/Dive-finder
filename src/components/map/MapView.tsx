"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import type { MapPin } from "@/lib/services/mapService";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils/cn";

const MapLibreMap = dynamic(() => import("./MapLibreMap").then((m) => m.MapLibreMap), { ssr: false });

// hideListOnLg: the plain-name list below the map exists so the map's
// content stays reachable without a mouse (the pins themselves are custom,
// unlabeled DOM markers). On a page that already shows a full destination
// list next to the map at desktop width (Results), that fallback becomes a
// second, less detailed copy of the same list sitting right below the
// first — pass true there to keep it only below lg, where the map is the
// only list on screen.
export function MapView({ pins, hideListOnLg = false }: { pins: MapPin[]; hideListOnLg?: boolean }) {
  if (pins.length === 0) {
    return (
      <EmptyState
        title="No destinations have verified coordinates yet"
        description="Coordinates are only added once they're sourced and verified — see docs/data-governance.md."
      />
    );
  }

  return (
    <div>
      <div className="h-[70vh] overflow-hidden rounded-xl2 border border-abyss-100">
        <MapLibreMap pins={pins} />
      </div>
      <ul className={cn("mt-4 grid gap-2 sm:grid-cols-3", hideListOnLg && "lg:hidden")}>
        {pins.map((pin) => (
          <li key={pin.id}>
            <Link
              href={`/destinations/${pin.slug}`}
              className="focus-ring block rounded-lg border border-abyss-100 bg-white px-3 py-2 text-sm text-abyss-700 hover:bg-abyss-50"
            >
              {pin.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
