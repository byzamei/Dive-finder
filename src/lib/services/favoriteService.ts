import type { SupabaseClient } from "@supabase/supabase-js";
import type { Favorite } from "@/lib/types/domain";

/** All operations are scoped to the authenticated user by RLS (T008) — no explicit user_id filter needed for reads beyond what RLS already enforces, but we pass it anyway for clarity/tests. */

export async function listFavorites(supabase: SupabaseClient, userId: string): Promise<Favorite[]> {
  const { data, error } = await supabase.from("favorites").select("*").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []) as Favorite[];
}

export async function addFavorite(
  supabase: SupabaseClient,
  userId: string,
  entityType: Favorite["entity_type"],
  entityId: string,
  listId?: string | null
): Promise<void> {
  const { error } = await supabase.from("favorites").upsert(
    { user_id: userId, entity_type: entityType, entity_id: entityId, list_id: listId ?? null },
    { onConflict: "user_id,entity_type,entity_id" }
  );
  if (error) throw error;
}

export async function isFavorited(
  supabase: SupabaseClient,
  userId: string,
  entityType: Favorite["entity_type"],
  entityId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function removeFavorite(
  supabase: SupabaseClient,
  userId: string,
  entityType: Favorite["entity_type"],
  entityId: string
): Promise<void> {
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId);
  if (error) throw error;
}
