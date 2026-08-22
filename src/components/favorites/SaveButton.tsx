"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { addFavorite, removeFavorite } from "@/lib/services/favoriteService";
import type { Favorite } from "@/lib/types/domain";

export function SaveButton({
  userId,
  entityType,
  entityId,
  initialSaved,
}: {
  userId: string | null;
  entityType: Favorite["entity_type"];
  entityId: string;
  initialSaved: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function toggle() {
    if (!userId) {
      router.push(`/login?redirectTo=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setPending(true);
    setError(false);
    const supabase = createClient();
    try {
      if (saved) {
        await removeFavorite(supabase, userId, entityType, entityId);
        setSaved(false);
      } else {
        await addFavorite(supabase, userId, entityType, entityId);
        setSaved(true);
      }
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={saved}
        className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-abyss-200 bg-white px-3.5 py-1.5 text-sm font-medium text-abyss-700 transition-colors hover:bg-abyss-50 disabled:opacity-50"
      >
        <HeartIcon
          className={saved ? "h-4 w-4 fill-coral-500 stroke-coral-500" : "h-4 w-4 fill-none stroke-current"}
        />
        {saved ? "Saved" : "Save"}
      </button>
      {error && <span className="text-xs text-coral-600">Couldn&apos;t save — try again.</span>}
    </div>
  );
}

function HeartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth={1.75} {...props}>
      <path d="M12 20s-7-4.5-9.5-9A5 5 0 0112 6a5 5 0 019.5 5c-2.5 4.5-9.5 9-9.5 9z" />
    </svg>
  );
}
