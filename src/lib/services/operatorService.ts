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

export interface DestinationStartingPrice {
  amountMin: number;
  currency: string;
}

/**
 * The cheapest real, currently-listed operator price per destination —
 * the minimum `amount_min` across that destination's own dive centers and
 * liveaboards. Never a guess or an estimate: destinations with no priced
 * operator yet are simply absent from the returned map. Different
 * currencies are NOT converted (no live FX rate to use honestly), so this
 * is "cheapest as originally listed," not a normalized comparison.
 */
export async function getCheapestPricePerDestination(
  supabase: SupabaseClient,
  destinationIds: string[]
): Promise<Map<string, DestinationStartingPrice>> {
  if (destinationIds.length === 0) return new Map();

  const [{ data: centers }, { data: liveaboards }] = await Promise.all([
    supabase.from("dive_centers").select("id, destination_id").in("destination_id", destinationIds),
    supabase.from("liveaboards").select("id, destination_id").in("destination_id", destinationIds),
  ]);

  const destinationByOperatorId = new Map<string, string>();
  (centers ?? []).forEach((c) => destinationByOperatorId.set((c as { id: string }).id, (c as { destination_id: string }).destination_id));
  (liveaboards ?? []).forEach((l) => destinationByOperatorId.set((l as { id: string }).id, (l as { destination_id: string }).destination_id));

  const operatorIds = Array.from(destinationByOperatorId.keys());
  if (operatorIds.length === 0) return new Map();

  const { data: prices, error } = await supabase
    .from("prices")
    .select("entity_id, amount_min, currency")
    .in("entity_type", ["dive_center", "liveaboard"])
    .in("entity_id", operatorIds)
    .not("amount_min", "is", null)
    .or("expires_at.is.null,expires_at.gt." + new Date().toISOString());
  if (error) throw error;

  const cheapestByDestination = new Map<string, DestinationStartingPrice>();
  ((prices ?? []) as { entity_id: string; amount_min: number; currency: string }[]).forEach((p) => {
    const destinationId = destinationByOperatorId.get(p.entity_id);
    if (!destinationId) return;
    const current = cheapestByDestination.get(destinationId);
    if (!current || p.amount_min < current.amountMin) {
      cheapestByDestination.set(destinationId, { amountMin: p.amount_min, currency: p.currency });
    }
  });
  return cheapestByDestination;
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
