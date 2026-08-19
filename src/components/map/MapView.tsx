"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { isMapConfigured, type MapPin } from "@/lib/services/mapService";
import { EmptyState } from "@/components/ui/EmptyState";

const MapboxMap = dynamic(() => import("./MapboxMap").then((m) => m.MapboxMap), { ssr: false });

export function MapView({ pins }: { pins: MapPin[] }) {
  if (!isMapConfigured) {
    return (
      <div>
        <div className="mb-4 rounded-xl2 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Map provider is not configured (NEXT_PUBLIC_MAPBOX_TOKEN is unset) — showing a list view instead.
          See .env.example and README.md for setup.
        </div>
        {pins.length === 0 ? (
          <EmptyState title="No destinations have verified coordinates yet" />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {pins.map((pin) => (
              <li key={pin.id}>
                <Link
                  href={`/destinations/${pin.slug}`}
                  className="focus-ring block rounded-xl2 border border-abyss-100 bg-white p-4 shadow-card hover:-translate-y-0.5 transition-transform"
                >
                  <p className="font-medium text-abyss-900">{pin.name}</p>
                  <p className="mt-1 text-xs text-abyss-400">
                    {pin.latitude.toFixed(2)}, {pin.longitude.toFixed(2)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="h-[70vh] overflow-hidden rounded-xl2 border border-abyss-100">
      <MapboxMap pins={pins} />
    </div>
  );
}
