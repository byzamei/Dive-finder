"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [seen, setSeen] = useState(initialSeen);
  const [pending, setPending] = useState(false);

  if (!userId) {
    return (
      <Link href="/login?redirectTo=/wildlife" className="focus-ring text-sm text-ocean-600 underline">
        Sign in to add this to your life list
      </Link>
    );
  }

  async function unmark() {
    setPending(true);
    const supabase = createClient();
    await unmarkSpeciesSeen(supabase, userId!, speciesId);
    setSeen(false);
    setPending(false);
  }

  // Marking as seen also returns to the Wildlife list, so checking off
  // several animals in a row doesn't need a manual "back" each time.
  async function markAndReturnToList() {
    setPending(true);
    const supabase = createClient();
    await markSpeciesSeen(supabase, userId!, speciesId);
    router.push("/wildlife");
  }

  if (seen) {
    return (
      <Button variant="secondary" size="sm" onClick={unmark} disabled={pending} type="button">
        ✓ Seen it
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={markAndReturnToList} disabled={pending} type="button">
      {pending ? "Saving…" : "Save and back to Wildlife"}
    </Button>
  );
}
