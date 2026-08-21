"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { listPhotosForEntry, uploadDivePhoto, deleteDivePhoto, getSignedPhotoUrls } from "@/lib/services/divePhotoService";
import type { DiveLogPhoto } from "@/lib/types/domain";

export function DivePhotoManager({ userId, entryId }: { userId: string; entryId: string }) {
  const [photos, setPhotos] = useState<DiveLogPhoto[]>([]);
  const [urls, setUrls] = useState<Map<string, string>>(new Map());
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const supabase = createClient();
    const list = await listPhotosForEntry(supabase, entryId);
    setPhotos(list);
    setUrls(await getSignedPhotoUrls(supabase, list));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    const supabase = createClient();
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        await uploadDivePhoto(supabase, userId, entryId, file);
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't upload that photo");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(photo: DiveLogPhoto) {
    const supabase = createClient();
    await deleteDivePhoto(supabase, photo);
    await refresh();
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs text-abyss-500">Photos</label>

      {photos.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((p) => (
            <div key={p.id} className="group relative">
              {urls.get(p.id) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={urls.get(p.id)} alt="" className="h-24 w-full rounded-lg object-cover" />
              ) : (
                <div className="h-24 w-full animate-pulse rounded-lg bg-abyss-100" />
              )}
              <button
                type="button"
                onClick={() => handleDelete(p)}
                className="focus-ring absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-abyss-900/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Remove photo"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <label className="focus-ring inline-block cursor-pointer rounded-lg border border-dashed border-abyss-200 px-4 py-2 text-sm text-abyss-600 hover:bg-abyss-50">
        {uploading ? "Uploading…" : "Add photos"}
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={uploading}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>
      {error && <p className="mt-1.5 text-sm text-coral-600">{error}</p>}
      <p className="mt-1.5 text-xs text-abyss-400">
        Only visible to the people this dive is shared with, same as its &ldquo;Who can see this dive&rdquo; setting.
      </p>
    </div>
  );
}
