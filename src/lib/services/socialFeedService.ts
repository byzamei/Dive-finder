import type { SupabaseClient } from "@supabase/supabase-js";
import type { DiveLogEntry } from "@/lib/types/domain";
import { listFollowingIds } from "@/lib/services/followService";

export interface FeedEntry extends DiveLogEntry {
  author_id: string;
  author_display_name: string | null;
  author_avatar_url: string | null;
  site_name_resolved: string | null;
  destination_name: string | null;
}

interface FeedRow extends DiveLogEntry {
  profiles: { id: string; display_name: string | null; avatar_url: string | null } | null;
  destinations: { name: string } | null;
  dive_sites: { name: string } | null;
}

/**
 * Shared dives from people this user follows, plus their own shared dives
 * — never anyone's private entries, regardless of what RLS would
 * otherwise let the viewer read (RLS is the backstop; this filter is the
 * actual feed semantics: "shared with me," not "everything I happen to
 * have access to").
 */
export async function listFeed(supabase: SupabaseClient, viewerId: string): Promise<FeedEntry[]> {
  const followingIds = await listFollowingIds(supabase, viewerId);
  const authorIds = [...new Set([...followingIds, viewerId])];
  if (authorIds.length === 0) return [];

  const { data, error } = await supabase
    .from("dive_log_entries")
    .select("*, profiles(id, display_name, avatar_url), destinations(name), dive_sites(name)")
    .in("user_id", authorIds)
    .neq("visibility", "private")
    .order("dive_date", { ascending: false })
    .limit(50);
  if (error) throw error;

  return ((data ?? []) as unknown as FeedRow[]).map((row) => ({
    ...row,
    author_id: row.profiles?.id ?? row.user_id,
    author_display_name: row.profiles?.display_name ?? null,
    author_avatar_url: row.profiles?.avatar_url ?? null,
    site_name_resolved: row.dive_sites?.name ?? row.site_name,
    destination_name: row.destinations?.name ?? null,
  }));
}

/** A single diver's shared dives — for their public profile page. Returns [] if the viewer isn't allowed to see any (RLS enforced). */
export async function listSharedEntriesForUser(supabase: SupabaseClient, userId: string): Promise<FeedEntry[]> {
  const { data, error } = await supabase
    .from("dive_log_entries")
    .select("*, profiles(id, display_name, avatar_url), destinations(name), dive_sites(name)")
    .eq("user_id", userId)
    .neq("visibility", "private")
    .order("dive_date", { ascending: false });
  if (error) throw error;

  return ((data ?? []) as unknown as FeedRow[]).map((row) => ({
    ...row,
    author_id: row.profiles?.id ?? row.user_id,
    author_display_name: row.profiles?.display_name ?? null,
    author_avatar_url: row.profiles?.avatar_url ?? null,
    site_name_resolved: row.dive_sites?.name ?? row.site_name,
    destination_name: row.destinations?.name ?? null,
  }));
}
