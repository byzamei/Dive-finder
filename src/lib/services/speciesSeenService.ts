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

export async function unmarkSpeciesSeen(supabase: SupabaseClient, userId: string, speciesId: string): Promise<void> {
  const { error } = await supabase
    .from("user_species_seen")
    .delete()
    .eq("user_id", userId)
    .eq("species_id", speciesId);
  if (error) throw error;
}
