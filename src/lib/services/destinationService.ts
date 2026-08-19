import type { SupabaseClient } from "@supabase/supabase-js";
import type { DataClaim, Destination, DiveSite, MarineSpecies } from "@/lib/types/domain";

/** Data access for destination/site browsing, detail pages, and admin CRUD. */

export async function getDestinationBySlug(supabase: SupabaseClient, slug: string): Promise<Destination | null> {
  const { data, error } = await supabase.from("destinations").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data as Destination | null;
}

export async function listPublishedDestinations(
  supabase: SupabaseClient,
  opts: { includeDemo?: boolean } = {}
): Promise<Destination[]> {
  let query = supabase.from("destinations").select("*").eq("status", "published").order("name");
  if (!opts.includeDemo) query = query.eq("demo_data", false);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Destination[];
}

export async function getDiveSitesForDestination(supabase: SupabaseClient, destinationId: string): Promise<DiveSite[]> {
  const { data, error } = await supabase
    .from("dive_sites")
    .select("*")
    .eq("destination_id", destinationId)
    .eq("status", "published")
    .order("name");
  if (error) throw error;
  return (data ?? []) as DiveSite[];
}

export async function getDiveSiteBySlug(supabase: SupabaseClient, slug: string): Promise<DiveSite | null> {
  const { data, error } = await supabase.from("dive_sites").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data as DiveSite | null;
}

export async function getSpeciesForDestination(
  supabase: SupabaseClient,
  destinationId: string
): Promise<MarineSpecies[]> {
  const { data, error } = await supabase
    .from("destination_species")
    .select("marine_species(*)")
    .eq("destination_id", destinationId);
  if (error) throw error;
  return ((data ?? []) as unknown as { marine_species: MarineSpecies }[]).map((r) => r.marine_species);
}

export async function getVerifiedClaims(
  supabase: SupabaseClient,
  entityType: string,
  entityId: string
): Promise<DataClaim[]> {
  const { data, error } = await supabase
    .from("data_claims")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .is("superseded_by", null)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DataClaim[];
}
