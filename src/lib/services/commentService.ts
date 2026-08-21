import type { SupabaseClient } from "@supabase/supabase-js";
import type { DiveComment } from "@/lib/types/domain";

export interface DiveCommentWithAuthor extends DiveComment {
  author_display_name: string | null;
  author_avatar_url: string | null;
}

export async function listComments(supabase: SupabaseClient, entryId: string): Promise<DiveCommentWithAuthor[]> {
  const { data, error } = await supabase
    .from("dive_comments")
    .select("*, profiles(display_name, avatar_url)")
    .eq("dive_log_entry_id", entryId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as unknown as (DiveComment & { profiles: { display_name: string | null; avatar_url: string | null } | null })[]).map(
    (row) => ({ ...row, author_display_name: row.profiles?.display_name ?? null, author_avatar_url: row.profiles?.avatar_url ?? null })
  );
}

export async function addComment(supabase: SupabaseClient, entryId: string, userId: string, body: string): Promise<void> {
  const { error } = await supabase.from("dive_comments").insert({ dive_log_entry_id: entryId, user_id: userId, body });
  if (error) throw error;
}

export async function deleteComment(supabase: SupabaseClient, commentId: string): Promise<void> {
  const { error } = await supabase.from("dive_comments").delete().eq("id", commentId);
  if (error) throw error;
}
