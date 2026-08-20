import type { SupabaseClient } from "@supabase/supabase-js";
import type { Destination, DiveSite, MarineSpecies, SpeciesSeasonality } from "@/lib/types/domain";
import type { DiveSiteWithDestination } from "@/lib/services/destinationService";

export async function listSpecies(supabase: SupabaseClient): Promise<MarineSpecies[]> {
  const { data, error } = await supabase.from("marine_species").select("*").order("common_name");
  if (error) throw error;
  return (data ?? []) as MarineSpecies[];
}

export async function getSpeciesBySlug(supabase: SupabaseClient, slug: string): Promise<MarineSpecies | null> {
  const { data, error } = await supabase.from("marine_species").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data as MarineSpecies | null;
}

export async function getDestinationsForSpecies(
  supabase: SupabaseClient,
  speciesId: string
): Promise<Destination[]> {
  const { data, error } = await supabase
    .from("destination_species")
    .select("destinations(*)")
    .eq("species_id", speciesId);
  if (error) throw error;
  return ((data ?? []) as unknown as { destinations: Destination }[]).map((r) => r.destinations);
}

export async function getSitesForSpecies(
  supabase: SupabaseClient,
  speciesId: string
): Promise<DiveSiteWithDestination[]> {
  const { data, error } = await supabase
    .from("site_species")
    .select("dive_sites(*, destinations(name, slug))")
    .eq("species_id", speciesId);
  if (error) throw error;
  return (
    (data ?? []) as unknown as { dive_sites: DiveSite & { destinations: { name: string; slug: string } | null } }[]
  ).map((r) => ({
    ...r.dive_sites,
    destination_name: r.dive_sites.destinations?.name ?? "Unknown destination",
    destination_slug: r.dive_sites.destinations?.slug ?? "",
  }));
}

export async function getSeasonalityForSpecies(
  supabase: SupabaseClient,
  speciesId: string
): Promise<SpeciesSeasonality[]> {
  const { data, error } = await supabase.from("species_seasonality").select("*").eq("species_id", speciesId);
  if (error) throw error;
  return (data ?? []) as SpeciesSeasonality[];
}
