import type { SupabaseClient } from "@supabase/supabase-js";

export async function giveKudos(supabase: SupabaseClient, entryId: string, userId: string): Promise<void> {
  const { error } = await supabase.from("dive_kudos").insert({ dive_log_entry_id: entryId, user_id: userId });
  if (error) throw error;
}

export async function removeKudos(supabase: SupabaseClient, entryId: string, userId: string): Promise<void> {
  const { error } = await supabase.from("dive_kudos").delete().eq("dive_log_entry_id", entryId).eq("user_id", userId);
  if (error) throw error;
}

/** Kudos counts and "did the current viewer kudo this" flags for a batch of entries, one query each — avoids N+1 when rendering a feed. */
export async function getKudosSummary(
  supabase: SupabaseClient,
  entryIds: string[],
  viewerId: string | null
): Promise<Map<string, { count: number; viewerGaveKudos: boolean }>> {
  const summary = new Map<string, { count: number; viewerGaveKudos: boolean }>();
  if (entryIds.length === 0) return summary;

  const { data, error } = await supabase.from("dive_kudos").select("dive_log_entry_id, user_id").in("dive_log_entry_id", entryIds);
  if (error) throw error;

  ((data ?? []) as { dive_log_entry_id: string; user_id: string }[]).forEach((row) => {
    const current = summary.get(row.dive_log_entry_id) ?? { count: 0, viewerGaveKudos: false };
    current.count += 1;
    if (viewerId && row.user_id === viewerId) current.viewerGaveKudos = true;
    summary.set(row.dive_log_entry_id, current);
  });
  return summary;
}
