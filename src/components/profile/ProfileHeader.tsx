"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/lib/services/profileService";
import { computeBadges } from "@/lib/profile/badges";
import type { DiverProfile, Profile } from "@/lib/types/domain";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { BadgeGrid } from "@/components/profile/BadgeGrid";
import { Button } from "@/components/ui/Button";

function memberSince(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function ProfileHeader({
  userId,
  profile,
  diverProfile,
  savedCount,
  speciesSeenCount,
  divesLoggedCount,
}: {
  userId: string;
  profile: Profile;
  diverProfile: Partial<DiverProfile> | null;
  savedCount: number;
  speciesSeenCount: number;
  divesLoggedCount: number;
}) {
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [homeBase, setHomeBase] = useState(profile.home_base ?? "");
  const [profileVisibility, setProfileVisibility] = useState(profile.profile_visibility);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const badges = computeBadges({ diverProfile, savedCount, speciesSeenCount, divesLoggedCount });

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      await updateProfile(supabase, userId, {
        display_name: displayName || null,
        bio: bio || null,
        home_base: homeBase || null,
        profile_visibility: profileVisibility,
      });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl2 border border-abyss-100 bg-white shadow-card">
      <div className="h-16 bg-gradient-to-r from-ocean-600 to-seaglass-500 sm:h-20" />
      <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end sm:px-6 sm:pb-6">
        <div className="-mt-10 shrink-0 sm:-mt-12">
          <AvatarUpload userId={userId} displayName={profile.display_name} avatarUrl={avatarUrl} onUploaded={setAvatarUrl} />
        </div>

        <div className="flex-1 pt-1">
          {editing ? (
            <div className="space-y-2">
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-1.5 text-sm font-medium"
              />
              <input
                value={homeBase}
                onChange={(e) => setHomeBase(e.target.value)}
                placeholder="Home base (e.g. Lisbon, Portugal)"
                className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-1.5 text-sm"
              />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short bio…"
                rows={2}
                className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-1.5 text-sm"
              />
              <div>
                <label className="mb-1 block text-xs text-abyss-500">Who can see your profile</label>
                <select
                  value={profileVisibility}
                  onChange={(e) => setProfileVisibility(e.target.value as typeof profileVisibility)}
                  className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-1.5 text-sm"
                >
                  <option value="public">Public — anyone</option>
                  <option value="followers">Followers only</option>
                  <option value="private">Private — just you</option>
                </select>
                <p className="mt-1 text-xs text-abyss-400">
                  This only covers your name/bio/stats. Individual dives stay private unless you share them from the Logbook.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={save} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)} type="button">
                  Cancel
                </Button>
                {error && <span className="text-sm text-coral-600">{error}</span>}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <h1 className="font-display text-xl text-abyss-900 sm:text-2xl">{profile.display_name || "Diver"}</h1>
                <button type="button" onClick={() => setEditing(true)} className="focus-ring text-xs font-medium text-ocean-600 underline">
                  Edit profile
                </button>
              </div>
              {profile.home_base && <p className="mt-0.5 text-sm text-abyss-500">{profile.home_base}</p>}
              {profile.bio && <p className="mt-1 text-sm text-abyss-700">{profile.bio}</p>}
              <p className="mt-1 text-xs text-abyss-400">Member since {memberSince(profile.created_at)}</p>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 border-t border-abyss-100 px-5 py-4 text-center sm:px-6">
        <Link href="/saved" className="focus-ring rounded-lg hover:bg-abyss-50">
          <p className="font-display text-lg text-abyss-900">{savedCount}</p>
          <p className="text-xs text-abyss-400">Favorites</p>
        </Link>
        <Link href="/wildlife?filter=seen" className="focus-ring rounded-lg hover:bg-abyss-50">
          <p className="font-display text-lg text-abyss-900">{speciesSeenCount}</p>
          <p className="text-xs text-abyss-400">Species seen</p>
        </Link>
        <Link href="/logbook" className="focus-ring rounded-lg hover:bg-abyss-50">
          <p className="font-display text-lg text-abyss-900">{divesLoggedCount}</p>
          <p className="text-xs text-abyss-400">Dives logged</p>
        </Link>
      </div>

      <div className="border-t border-abyss-100 px-5 py-4 sm:px-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-abyss-400">Badges</p>
        <BadgeGrid badges={badges} />
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-abyss-100 px-5 py-3 text-sm sm:px-6">
        <Link href={`/divers/${userId}`} className="focus-ring text-ocean-600 underline">
          View your public profile
        </Link>
        <Link href="/feed" className="focus-ring text-ocean-600 underline">
          Feed
        </Link>
        <Link href="/divers" className="focus-ring text-ocean-600 underline">
          Find divers
        </Link>
      </div>
    </div>
  );
}
