import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { DiverProfileForm } from "@/components/profile/DiverProfileForm";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import type { CertificationAgency, Certification, DiverProfile, MarineSpecies, Profile } from "@/lib/types/domain";

export default async function ProfilePage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [
    { data: profile },
    { data: diverProfile },
    { data: agencies },
    { data: certifications },
    { data: species },
    { count: savedCount },
    { count: speciesSeenCount },
    { count: divesLoggedCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("diver_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("certification_agencies").select("*").order("name"),
    supabase.from("certifications").select("*"),
    supabase.from("marine_species").select("*").order("common_name"),
    supabase.from("favorites").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("user_species_seen").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("dive_log_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      {profile && (
        <ProfileHeader
          userId={user.id}
          profile={profile as Profile}
          diverProfile={diverProfile as DiverProfile | null}
          savedCount={savedCount ?? 0}
          speciesSeenCount={speciesSeenCount ?? 0}
          divesLoggedCount={divesLoggedCount ?? 0}
        />
      )}

      <Link
        href="/logbook"
        className="focus-ring group mt-6 flex items-center justify-between gap-4 rounded-xl2 border border-abyss-100 bg-gradient-to-r from-seaglass-50 to-ocean-50 p-4 transition-transform hover:-translate-y-0.5"
      >
        <div>
          <p className="font-medium text-abyss-800">Your logbook</p>
          <p className="mt-0.5 text-sm text-abyss-500">Log dives, depths and conditions — species you log are added to your life list.</p>
        </div>
        <span aria-hidden className="shrink-0 text-2xl text-ocean-600 transition-transform group-hover:translate-x-0.5">
          →
        </span>
      </Link>

      <Link
        href="/gear/mask-finder"
        className="focus-ring group mt-6 flex items-center justify-between gap-4 rounded-xl2 border border-abyss-100 bg-gradient-to-r from-ocean-50 to-sand-100 p-4 transition-transform hover:-translate-y-0.5"
      >
        <div>
          <p className="font-medium text-abyss-800">Find your mask fit</p>
          <p className="mt-0.5 text-sm text-abyss-500">An on-device face scan to suggest mask shapes that suit your face.</p>
        </div>
        <span aria-hidden className="shrink-0 text-2xl text-ocean-600 transition-transform group-hover:translate-x-0.5">
          →
        </span>
      </Link>

      <div className="mt-8">
        <h2 className="font-display text-2xl text-abyss-900">Your diver profile</h2>
        <p className="mt-1 text-sm text-abyss-500">
          Used to personalize search results — safety filters and match scoring. Never shared publicly.
        </p>
        <div className="mt-5">
          <DiverProfileForm
            userId={user.id}
            initial={diverProfile as DiverProfile | null}
            agencies={(agencies ?? []) as CertificationAgency[]}
            certifications={(certifications ?? []) as Certification[]}
            species={(species ?? []) as MarineSpecies[]}
          />
        </div>
      </div>
    </main>
  );
}
