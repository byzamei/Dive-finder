"use client";

import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Map as MapLibreGlMap, Marker as MapLibreMarker, StyleSpecification } from "maplibre-gl";
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
    let markers: MapLibreMarker[] = [];

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

      // Destinations often sit close together at world zoom (e.g. several
      // Red Sea or Coral Triangle spots), which made every price pill
      // overlap into an unreadable stack. Group pins that would land within
      // a few dozen pixels of each other on screen into a single numbered
      // cluster instead; clicking it zooms in until they separate on their
      // own, at which point each shows its own price pill again.
      function renderMarkers() {
        markers.forEach((m) => m.remove());
        markers = [];

        for (const cluster of clusterPins(map, pins)) {
          if (cluster.length === 1) {
            const pin = cluster[0]!;
            const marker = pin.priceLabel
              ? new Marker({ element: priceBubbleElement(pin.priceLabel) })
              : new Marker({ color: "#f4703f" });
            marker
              .setLngLat([pin.longitude, pin.latitude])
              .setPopup(new Popup({ offset: 12 }).setText(pin.name))
              .addTo(map);
            marker.getElement().addEventListener("click", () => onSelect?.(pin));
            markers.push(marker);
          } else {
            const centerLng = cluster.reduce((sum, p) => sum + p.longitude, 0) / cluster.length;
            const centerLat = cluster.reduce((sum, p) => sum + p.latitude, 0) / cluster.length;
            const el = clusterBubbleElement(cluster.length);
            const marker = new Marker({ element: el }).setLngLat([centerLng, centerLat]).addTo(map);
            el.addEventListener("click", () => {
              const bounds = cluster.reduce(
                (b, p) => b.extend([p.longitude, p.latitude]),
                new LngLatBounds([cluster[0]!.longitude, cluster[0]!.latitude], [cluster[0]!.longitude, cluster[0]!.latitude])
              );
              map.fitBounds(bounds, { padding: 64, maxZoom: 8 });
            });
            markers.push(marker);
          }
        }
      }

      map.on("load", renderMarkers);
      map.on("moveend", renderMarkers);

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
      markers.forEach((m) => m.remove());
      mapRef.current?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins]);

  return <div ref={containerRef} className="h-full w-full rounded-xl2" />;
}

// Greedy screen-space grouping: any pin within CLUSTER_RADIUS_PX of an
// already-placed group's first member joins that group. Good enough for a
// few dozen markers and cheap to recompute on every moveend — no need for
// a real spatial index at this scale.
const CLUSTER_RADIUS_PX = 42;

function clusterPins(map: MapLibreGlMap, pins: MapPin[]): MapPin[][] {
  const projected = pins.map((pin) => ({ pin, point: map.project([pin.longitude, pin.latitude]) }));
  const clusters: MapPin[][] = [];
  const used = new Array(projected.length).fill(false);

  for (let i = 0; i < projected.length; i++) {
    if (used[i]) continue;
    const group = [projected[i]!.pin];
    used[i] = true;
    for (let j = i + 1; j < projected.length; j++) {
      if (used[j]) continue;
      const dx = projected[i]!.point.x - projected[j]!.point.x;
      const dy = projected[i]!.point.y - projected[j]!.point.y;
      if (Math.sqrt(dx * dx + dy * dy) < CLUSTER_RADIUS_PX) {
        group.push(projected[j]!.pin);
        used[j] = true;
      }
    }
    clusters.push(group);
  }
  return clusters;
}

// Stands in for a group of overlapping pins at the current zoom — shows the
// count rather than guessing a shared price (the pins inside can be in
// different currencies, so summarizing them as one price would misrepresent
// the group). Clicking zooms in until the group spreads out into its own
// individual price pills.
function clusterBubbleElement(count: number): HTMLDivElement {
  const el = document.createElement("div");
  el.textContent = String(count);
  el.setAttribute("aria-label", `${count} destinations, click to zoom in`);
  el.style.cssText = [
    "background:#185c88",
    "color:#fff",
    "font:700 13px system-ui,sans-serif",
    "width:32px",
    "height:32px",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "border-radius:999px",
    "box-shadow:0 1px 4px rgba(0,0,0,.35)",
    "cursor:pointer",
    "border:2px solid #fff",
  ].join(";");
  return el;
}

// A Google-Flights-style price pill instead of a plain dot, for callers
// that pass a real observed price (MapPin.priceLabel).
function priceBubbleElement(priceLabel: string): HTMLDivElement {
  const el = document.createElement("div");
  el.textContent = priceLabel;
  el.style.cssText = [
    "background:#1c2b3a",
    "color:#fff",
    "font:600 12px system-ui,sans-serif",
    "padding:4px 9px",
    "border-radius:999px",
    "box-shadow:0 1px 4px rgba(0,0,0,.35)",
    "white-space:nowrap",
    "cursor:pointer",
    "border:1.5px solid #fff",
  ].join(";");
  return el;
}
