"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadAvatar, updateProfile } from "@/lib/services/profileService";

export function AvatarUpload({
  userId,
  displayName,
  avatarUrl,
  onUploaded,
}: {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initial = (displayName || "?").trim().charAt(0).toUpperCase();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const url = await uploadAvatar(supabase, userId, file);
      await updateProfile(supabase, userId, { avatar_url: url });
      onUploaded(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="focus-ring group relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-white bg-ocean-100 shadow-card sm:h-24 sm:w-24"
        aria-label="Change profile photo"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-display text-2xl text-ocean-700">
            {initial}
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-abyss-900/0 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:bg-abyss-900/50 group-hover:opacity-100">
          {uploading ? "Uploading…" : "Change"}
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {error && <p className="max-w-[10rem] text-center text-xs text-coral-600">{error}</p>}
    </div>
  );
}
