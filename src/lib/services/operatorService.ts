import type { SupabaseClient } from "@supabase/supabase-js";
import type { DiveCenter, Liveaboard, Price } from "@/lib/types/domain";

/**
 * Real, sourced dive centers and liveaboards for a destination — never
 * ranked or filtered by anything but name, so no operator reads as
 * favored over another. See docs/operators.md.
 */

export async function listDiveCentersForDestination(supabase: SupabaseClient, destinationId: string): Promise<DiveCenter[]> {
  const { data, error } = await supabase
    .from("dive_centers")
    .select("*")
    .eq("destination_id", destinationId)
    .order("name");
  if (error) throw error;
  return (data ?? []) as DiveCenter[];
}

export async function listLiveaboardsForDestination(supabase: SupabaseClient, destinationId: string): Promise<Liveaboard[]> {
  const { data, error } = await supabase
    .from("liveaboards")
    .select("*")
    .eq("destination_id", destinationId)
    .order("name");
  if (error) throw error;
  return (data ?? []) as Liveaboard[];
}

/** Indicative prices for a set of operator entities, keyed by entity_id. */
export async function getPricesForEntities(
  supabase: SupabaseClient,
  entityType: Price["entity_type"],
  entityIds: string[]
): Promise<Map<string, Price[]>> {
  if (entityIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("prices")
    .select("*")
    .eq("entity_type", entityType)
    .in("entity_id", entityIds)
    .or("expires_at.is.null,expires_at.gt." + new Date().toISOString());
  if (error) throw error;
  const map = new Map<string, Price[]>();
  for (const price of (data ?? []) as Price[]) {
    const list = map.get(price.entity_id) ?? [];
    list.push(price);
    map.set(price.entity_id, list);
  }
  return map;
}
