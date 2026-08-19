import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types/domain";

export async function getProfile(supabase: SupabaseClient, userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  patch: Partial<Pick<Profile, "display_name" | "bio" | "home_base" | "avatar_url">>
): Promise<void> {
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (error) throw error;
}

/** Uploads to the public `avatars` bucket under avatars/{userId}/{filename}, then returns the public URL. */
export async function uploadAvatar(supabase: SupabaseClient, userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/avatar.${ext}`;
  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}
