"use client";

import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Map as MapLibreGlMap, StyleSpecification } from "maplibre-gl";
import type { MapPin } from "@/lib/services/mapService";

// Free, no-API-key basemap (CARTO's Dark Matter raster tiles, built on
// OpenStreetMap data) — no signup step for a non-technical user before the
// map can show anything real. See docs/architecture.md for why this
// replaced the earlier Mapbox integration, which required a personal
// access token to render anything at all.
const STYLE: StyleSpecification = {
  version: 8,
  sources: {
    basemap: {
      type: "raster",
      tiles: ["https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors © CARTO",
    },
  },
  layers: [{ id: "basemap", type: "raster", source: "basemap" }],
};

// Loaded only client-side via next/dynamic (ssr: false) from MapView.tsx.
export function MapLibreMap({ pins, onSelect }: { pins: MapPin[]; onSelect?: (pin: MapPin) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreGlMap | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const { Map, Marker, Popup, LngLatBounds } = await import("maplibre-gl");
      if (!containerRef.current || cancelled) return;

      const map = new Map({
        container: containerRef.current,
        style: STYLE,
        center: [20, 10],
        zoom: 1.4,
      });
      mapRef.current = map;

      pins.forEach((pin) => {
        const marker = new Marker({ color: "#f4703f" })
          .setLngLat([pin.longitude, pin.latitude])
          .setPopup(new Popup({ offset: 12 }).setText(pin.name))
          .addTo(map);
        marker.getElement().addEventListener("click", () => onSelect?.(pin));
      });

      if (pins.length > 1) {
        const bounds = pins.reduce(
          (b, p) => b.extend([p.longitude, p.latitude]),
          new LngLatBounds([pins[0]!.longitude, pins[0]!.latitude], [pins[0]!.longitude, pins[0]!.latitude])
        );
        map.fitBounds(bounds, { padding: 48, maxZoom: 6 });
      } else if (pins.length === 1) {
        map.setCenter([pins[0]!.longitude, pins[0]!.latitude]);
        map.setZoom(5);
      }
    }

    init();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins]);

  return <div ref={containerRef} className="h-full w-full rounded-xl2" />;
}
