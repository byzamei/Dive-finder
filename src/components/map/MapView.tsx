"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import type { MapPin } from "@/lib/services/mapService";
import { EmptyState } from "@/components/ui/EmptyState";

const MapLibreMap = dynamic(() => import("./MapLibreMap").then((m) => m.MapLibreMap), { ssr: false });

export function MapView({ pins }: { pins: MapPin[] }) {
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
      <ul className="mt-4 grid gap-2 sm:grid-cols-3">
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
