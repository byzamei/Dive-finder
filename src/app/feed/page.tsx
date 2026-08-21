import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { listFeed } from "@/lib/services/socialFeedService";
import { DivePostCard } from "@/components/social/DivePostCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Feed" };

export default async function FeedPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="font-display text-3xl text-abyss-900">Feed</h1>
        <div className="mt-8 rounded-xl2 border border-abyss-100 bg-sand-100 p-6 text-center">
          <p className="font-medium text-abyss-800">Sign in to see dives from divers you follow</p>
          <ButtonLink href="/login?redirectTo=/feed" className="mt-4">
            Sign in
          </ButtonLink>
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const entries = await listFeed(supabase, user.id);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-abyss-900">Feed</h1>
        <Link href="/divers" className="focus-ring text-sm text-ocean-600 underline">
          Find divers
        </Link>
      </div>
      <p className="mt-2 text-abyss-500">Dives shared by divers you follow.</p>

      <div className="mt-8 space-y-4">
        {entries.length === 0 ? (
          <EmptyState
            title="Nothing here yet"
            description="Follow other divers to see the dives they share, or share one of your own from the Logbook."
            action={
              <Link href="/divers" className="focus-ring text-sm font-medium text-ocean-600 underline">
                Find divers to follow
              </Link>
            }
          />
        ) : (
          entries.map((entry) => <DivePostCard key={entry.id} entry={entry} viewerId={user.id} />)
        )}
      </div>
    </main>
  );
}
