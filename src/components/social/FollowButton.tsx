"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { followUser, unfollowUser } from "@/lib/services/followService";
import { Button } from "@/components/ui/Button";

export function FollowButton({
  viewerId,
  profileId,
  initialFollowing,
}: {
  viewerId: string | null;
  profileId: string;
  initialFollowing: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);

  if (!viewerId) {
    return (
      <Button size="sm" variant="outline" onClick={() => router.push(`/login?redirectTo=/divers/${profileId}`)}>
        Sign in to follow
      </Button>
    );
  }

  if (viewerId === profileId) return null;

  async function toggle() {
    setPending(true);
    const supabase = createClient();
    try {
      if (following) {
        await unfollowUser(supabase, viewerId!, profileId);
        setFollowing(false);
      } else {
        await followUser(supabase, viewerId!, profileId);
        setFollowing(true);
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button size="sm" variant={following ? "outline" : "primary"} onClick={toggle} disabled={pending}>
      {following ? "Following" : "Follow"}
    </Button>
  );
}
