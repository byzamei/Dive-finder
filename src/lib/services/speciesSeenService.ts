import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserSpeciesSeen } from "@/lib/types/domain";

export async function listSeenSpecies(supabase: SupabaseClient, userId: string): Promise<UserSpeciesSeen[]> {
  const { data, error } = await supabase.from("user_species_seen").select("*").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []) as UserSpeciesSeen[];
}

export async function markSpeciesSeen(
  supabase: SupabaseClient,
  userId: string,
  speciesId: string,
  seenOn?: string | null
): Promise<void> {
  const { error } = await supabase
    .from("user_species_seen")
    .upsert({ user_id: userId, species_id: speciesId, seen_on: seenOn ?? null }, { onConflict: "user_id,species_id" });
  if (error) throw error;
}

/**
 * Marks a batch of species as seen on a given dive date — used when
 * logging (or editing) a dive log entry's observed species, so the life
 * list and the logbook are always the same underlying data, never two
 * things to keep in sync by hand. Keeps the EARLIEST seen_on for a species
 * that's already on the list (logging dives out of chronological order,
 * or editing an older entry, must never overwrite an earlier first
 * sighting with a later one).
 */
export async function markSpeciesSeenFromDive(
  supabase: SupabaseClient,
  userId: string,
  speciesIds: string[],
  diveDate: string
): Promise<void> {
  if (speciesIds.length === 0) return;
  const { data: existing, error: fetchError } = await supabase
    .from("user_species_seen")
    .select("species_id, seen_on")
    .eq("user_id", userId)
    .in("species_id", speciesIds);
  if (fetchError) throw fetchError;

  const existingBySpecies = new Map(
    ((existing ?? []) as { species_id: string; seen_on: string | null }[]).map((r) => [r.species_id, r.seen_on])
  );

  const rows = speciesIds.map((speciesId) => {
    const current = existingBySpecies.get(speciesId);
    const seenOn = !current || diveDate < current ? diveDate : current;
    return { user_id: userId, species_id: speciesId, seen_on: seenOn };
  });

  const { error } = await supabase.from("user_species_seen").upsert(rows, { onConflict: "user_id,species_id" });
  if (error) throw error;
}

export async function unmarkSpeciesSeen(supabase: SupabaseClient, userId: string, speciesId: string): Promise<void> {
  const { error } = await supabase
    .from("user_species_seen")
    .delete()
    .eq("user_id", userId)
    .eq("species_id", speciesId);
  if (error) throw error;
}
