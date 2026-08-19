"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { markSpeciesSeen, unmarkSpeciesSeen } from "@/lib/services/speciesSeenService";
import { Button } from "@/components/ui/Button";

export function SpeciesSeenToggle({
  userId,
  speciesId,
  initialSeen,
}: {
  userId: string | null;
  speciesId: string;
  initialSeen: boolean;
}) {
  const [seen, setSeen] = useState(initialSeen);
  const [pending, setPending] = useState(false);

  if (!userId) {
    return (
      <Link href="/login?redirectTo=/wildlife" className="focus-ring text-sm text-ocean-600 underline">
        Sign in to add this to your life list
      </Link>
    );
  }

  async function toggle() {
    setPending(true);
    const supabase = createClient();
    if (seen) {
      await unmarkSpeciesSeen(supabase, userId!, speciesId);
      setSeen(false);
    } else {
      await markSpeciesSeen(supabase, userId!, speciesId);
      setSeen(true);
    }
    setPending(false);
  }

  return (
    <Button variant={seen ? "secondary" : "outline"} size="sm" onClick={toggle} disabled={pending} type="button">
      {seen ? "✓ Seen it" : "Mark as seen"}
    </Button>
  );
}
