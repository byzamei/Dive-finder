import type { SupabaseClient } from "@supabase/supabase-js";
import type { AccessType, DataClaim, Destination, DiveSite, MarineSpecies } from "@/lib/types/domain";

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

export interface DiveSiteWithDestination extends DiveSite {
  destination_name: string;
  destination_slug: string;
}

export async function listPublishedSites(supabase: SupabaseClient): Promise<DiveSiteWithDestination[]> {
  const { data, error } = await supabase
    .from("dive_sites")
    .select("*, destinations(name, slug)")
    .eq("status", "published")
    .order("name");
  if (error) throw error;
  return ((data ?? []) as unknown as (DiveSite & { destinations: { name: string; slug: string } | null })[]).map(
    (row) => ({
      ...row,
      destination_name: row.destinations?.name ?? "Unknown destination",
      destination_slug: row.destinations?.slug ?? "",
    })
  );
}

export interface PaginatedSites {
  sites: DiveSiteWithDestination[];
  total: number;
}

/** Same data as listPublishedSites, but filtered and paged server-side so the page count reflects the actual result set, not the full catalog. */
export async function listPublishedSitesPage(
  supabase: SupabaseClient,
  opts: { destinationId?: string; accessType?: AccessType; page: number; pageSize: number }
): Promise<PaginatedSites> {
  const from = (opts.page - 1) * opts.pageSize;
  const to = from + opts.pageSize - 1;

  let query = supabase
    .from("dive_sites")
    .select("*, destinations(name, slug)", { count: "exact" })
    .eq("status", "published");
  if (opts.destinationId) query = query.eq("destination_id", opts.destinationId);
  if (opts.accessType) query = query.eq("access_type", opts.accessType);

  const { data, count, error } = await query.order("name").range(from, to);
  if (error) throw error;

  const sites = ((data ?? []) as unknown as (DiveSite & { destinations: { name: string; slug: string } | null })[]).map(
    (row) => ({
      ...row,
      destination_name: row.destinations?.name ?? "Unknown destination",
      destination_slug: row.destinations?.slug ?? "",
    })
  );
  return { sites, total: count ?? sites.length };
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
