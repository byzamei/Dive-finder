import type { SupabaseClient } from "@supabase/supabase-js";

export async function followUser(supabase: SupabaseClient, followerId: string, followeeId: string): Promise<void> {
  const { error } = await supabase.from("follows").insert({ follower_id: followerId, followee_id: followeeId });
  if (error) throw error;
}

export async function unfollowUser(supabase: SupabaseClient, followerId: string, followeeId: string): Promise<void> {
  const { error } = await supabase.from("follows").delete().eq("follower_id", followerId).eq("followee_id", followeeId);
  if (error) throw error;
}

export async function isFollowing(supabase: SupabaseClient, followerId: string, followeeId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("followee_id", followeeId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function getFollowCounts(supabase: SupabaseClient, userId: string): Promise<{ followers: number; following: number }> {
  const [followers, following] = await Promise.all([
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("followee_id", userId),
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", userId),
  ]);
  if (followers.error) throw followers.error;
  if (following.error) throw following.error;
  return { followers: followers.count ?? 0, following: following.count ?? 0 };
}

/** IDs of everyone this user follows — the audience for their feed. */
export async function listFollowingIds(supabase: SupabaseClient, userId: string): Promise<string[]> {
  const { data, error } = await supabase.from("follows").select("followee_id").eq("follower_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.followee_id as string);
}
