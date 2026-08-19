import type { SupabaseClient } from "@supabase/supabase-js";
import type { SavedList } from "@/lib/types/domain";

export async function listSavedLists(supabase: SupabaseClient, userId: string): Promise<SavedList[]> {
  const { data, error } = await supabase.from("saved_lists").select("*").eq("user_id", userId).order("created_at");
  if (error) throw error;
  return (data ?? []) as SavedList[];
}

export async function createSavedList(supabase: SupabaseClient, userId: string, name: string): Promise<SavedList> {
  const { data, error } = await supabase
    .from("saved_lists")
    .insert({ user_id: userId, name })
    .select("*")
    .single();
  if (error) throw error;
  return data as SavedList;
}

export async function renameSavedList(supabase: SupabaseClient, listId: string, name: string): Promise<void> {
  const { error } = await supabase.from("saved_lists").update({ name }).eq("id", listId);
  if (error) throw error;
}

/** Deleting a list keeps its saved items — they just fall back to "Unsorted" (list_id set null by the FK). */
export async function deleteSavedList(supabase: SupabaseClient, listId: string): Promise<void> {
  const { error } = await supabase.from("saved_lists").delete().eq("id", listId);
  if (error) throw error;
}

export async function moveFavoriteToList(
  supabase: SupabaseClient,
  favoriteId: string,
  listId: string | null
): Promise<void> {
  const { error } = await supabase.from("favorites").update({ list_id: listId }).eq("id", favoriteId);
  if (error) throw error;
}
