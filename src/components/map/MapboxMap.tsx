"use client";

import { useEffect, useRef } from "react";
import type { MapPin } from "@/lib/services/mapService";

// Loaded only client-side via next/dynamic (ssr: false) from MapView.tsx,
// and only when NEXT_PUBLIC_MAPBOX_TOKEN is set — see mapService.ts for the
// fallback used otherwise.
export function MapboxMap({ pins, onSelect }: { pins: MapPin[]; onSelect?: (pin: MapPin) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("mapbox-gl").Map | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const mapboxgl = (await import("mapbox-gl")).default;
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
      if (!containerRef.current || cancelled) return;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [20, 10],
        zoom: 1.4,
      });
      mapRef.current = map;

      pins.forEach((pin) => {
        const marker = new mapboxgl.Marker({ color: "#f4703f" })
          .setLngLat([pin.longitude, pin.latitude])
          .setPopup(new mapboxgl.Popup({ offset: 12 }).setText(pin.name))
          .addTo(map);
        marker.getElement().addEventListener("click", () => onSelect?.(pin));
      });
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
