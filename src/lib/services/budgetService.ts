import type { SupabaseClient } from "@supabase/supabase-js";
import type { Price } from "@/lib/types/domain";

/**
 * Reads indicative price ranges. Never computes or displays a price for an
 * expired claim as "current" (T003) — always filters to
 * `expires_at is null or expires_at > now()`.
 */
export async function getIndicativePrices(
  supabase: SupabaseClient,
  entityType: Price["entity_type"],
  entityId: string
): Promise<Price[]> {
  const { data, error } = await supabase
    .from("prices")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
    .order("observed_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Price[];
}

export async function getExpiredPrices(
  supabase: SupabaseClient,
  entityType: Price["entity_type"],
  entityId: string
): Promise<Price[]> {
  const { data, error } = await supabase
    .from("prices")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .not("expires_at", "is", null)
    .lte("expires_at", new Date().toISOString());
  if (error) throw error;
  return (data ?? []) as Price[];
}
