import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isFollowing, getFollowCounts } from "@/lib/services/followService";
import { listSharedEntriesForUser } from "@/lib/services/socialFeedService";
import type { Profile } from "@/lib/types/domain";
import { FollowButton } from "@/components/social/FollowButton";
import { DivePostCard } from "@/components/social/DivePostCard";
import { EmptyState } from "@/components/ui/EmptyState";

export async function generateMetadata({ params }: { params: { userId: string } }): Promise<Metadata> {
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", params.userId).maybeSingle();
  return { title: profile?.display_name ?? "Diver profile" };
}

export default async function DiverProfilePage({ params }: { params: { userId: string } }) {
  const supabase = await createClient();
  const viewer = await getCurrentUser();

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", params.userId).maybeSingle();
  if (!profile) notFound();

  const [counts, following, sharedEntries] = await Promise.all([
    getFollowCounts(supabase, params.userId),
    viewer ? isFollowing(supabase, viewer.id, params.userId) : Promise.resolve(false),
    listSharedEntriesForUser(supabase, params.userId),
  ]);

  const distinctSpeciesSeen = new Set(sharedEntries.flatMap((e) => e.species_observed)).size;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="overflow-hidden rounded-xl2 border border-abyss-100 bg-white shadow-card">
        <div className="h-16 bg-gradient-to-r from-ocean-600 to-seaglass-500 sm:h-20" />
        <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:pb-6">
          <div className="-mt-10 flex items-end gap-4 sm:-mt-12">
            {(profile as Profile).avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={(profile as Profile).avatar_url!} alt="" className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-card" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-ocean-50 font-display text-2xl text-ocean-700 shadow-card">
                {((profile as Profile).display_name ?? "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="pb-1">
              <h1 className="font-display text-xl text-abyss-900">{(profile as Profile).display_name ?? "Diver"}</h1>
              {(profile as Profile).home_base && <p className="text-sm text-abyss-500">{(profile as Profile).home_base}</p>}
            </div>
          </div>
          <FollowButton viewerId={viewer?.id ?? null} profileId={params.userId} initialFollowing={following} />
        </div>

        {(profile as Profile).bio && <p className="border-t border-abyss-100 px-5 py-4 text-sm text-abyss-700 sm:px-6">{(profile as Profile).bio}</p>}

        <div className="grid grid-cols-4 gap-2 border-t border-abyss-100 px-5 py-4 text-center sm:px-6">
          <div>
            <p className="font-display text-lg text-abyss-900">{sharedEntries.length}</p>
            <p className="text-xs text-abyss-400">Dives shared</p>
          </div>
          <div>
            <p className="font-display text-lg text-abyss-900">{distinctSpeciesSeen}</p>
            <p className="text-xs text-abyss-400">Species seen</p>
          </div>
          <div>
            <p className="font-display text-lg text-abyss-900">{counts.followers}</p>
            <p className="text-xs text-abyss-400">Followers</p>
          </div>
          <div>
            <p className="font-display text-lg text-abyss-900">{counts.following}</p>
            <p className="text-xs text-abyss-400">Following</p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {sharedEntries.length === 0 ? (
          <EmptyState
            title="No shared dives yet"
            description={
              viewer?.id === params.userId
                ? "Dives you mark Public or Followers in your Logbook will show up here."
                : "This diver hasn't shared any dives yet."
            }
          />
        ) : (
          sharedEntries.map((entry) => <DivePostCard key={entry.id} entry={entry} viewerId={viewer?.id ?? null} />)
        )}
      </div>

      <p className="mt-6 text-center text-sm">
        <Link href="/divers" className="focus-ring text-ocean-600 underline">
          Find more divers
        </Link>
      </p>
    </main>
  );
}
