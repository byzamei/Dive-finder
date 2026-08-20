export interface MapPin {
  id: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  matchScore?: number;
}

/**
 * Map provider abstraction. Ships a MapLibre GL implementation
 * (src/components/map/MapLibreMap.tsx, loaded dynamically client-side
 * only, free CARTO/OSM tiles — no API key required) behind this file so
 * swapping providers later touches one file. Any destination without
 * verified coordinates is excluded from `pins`, never plotted at a
 * guessed location.
 */
export function toPins<T extends { id: string; name: string; slug: string; latitude: number | null; longitude: number | null }>(
  items: T[]
): MapPin[] {
  return items
    .filter((i): i is T & { latitude: number; longitude: number } => i.latitude != null && i.longitude != null)
    .map((i) => ({ id: i.id, name: i.name, slug: i.slug, latitude: i.latitude, longitude: i.longitude }));
}
