import type { SupabaseClient } from "@supabase/supabase-js";
import type { DiveLogPhoto } from "@/lib/types/domain";

const BUCKET = "dive-photos";
// Private bucket — the signed URL is time-limited and re-checks
// can_view_dive_entry() at issue time (see 0020_dive_photos.sql), so a
// leaked link stops working once it expires rather than staying valid
// forever the way a public-bucket URL would.
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function listPhotosForEntry(supabase: SupabaseClient, entryId: string): Promise<DiveLogPhoto[]> {
  const { data, error } = await supabase
    .from("dive_log_photos")
    .select("*")
    .eq("dive_log_entry_id", entryId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DiveLogPhoto[];
}

export async function uploadDivePhoto(supabase: SupabaseClient, userId: string, entryId: string, file: File): Promise<DiveLogPhoto> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${entryId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("dive_log_photos")
    .insert({ dive_log_entry_id: entryId, user_id: userId, storage_path: path })
    .select()
    .single();
  if (error) throw error;
  return data as DiveLogPhoto;
}

export async function deleteDivePhoto(supabase: SupabaseClient, photo: DiveLogPhoto): Promise<void> {
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([photo.storage_path]);
  if (storageError) throw storageError;
  const { error } = await supabase.from("dive_log_photos").delete().eq("id", photo.id);
  if (error) throw error;
}

export async function getSignedPhotoUrls(supabase: SupabaseClient, photos: DiveLogPhoto[]): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  await Promise.all(
    photos.map(async (photo) => {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(photo.storage_path, SIGNED_URL_TTL_SECONDS);
      if (data?.signedUrl) urls.set(photo.id, data.signedUrl);
    })
  );
  return urls;
}
