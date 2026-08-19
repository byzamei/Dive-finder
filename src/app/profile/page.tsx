import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { DiverProfileForm } from "@/components/profile/DiverProfileForm";
import type { CertificationAgency, Certification, DiverProfile, MarineSpecies } from "@/lib/types/domain";

export default async function ProfilePage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: profile }, { data: agencies }, { data: certifications }, { data: species }] = await Promise.all([
    supabase.from("diver_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("certification_agencies").select("*").order("name"),
    supabase.from("certifications").select("*"),
    supabase.from("marine_species").select("*").order("common_name"),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-display text-3xl text-abyss-900">Your diver profile</h1>
      <p className="mt-2 text-abyss-500">
        Used to personalize search results — safety filters and match scoring. Never shared publicly.
      </p>

      <Link
        href="/gear/mask-finder"
        className="focus-ring mt-6 block rounded-xl2 border border-abyss-100 bg-sand-100 p-4 text-sm hover:bg-sand-200"
      >
        <p className="font-medium text-abyss-800">Find your mask fit →</p>
        <p className="mt-0.5 text-abyss-500">An on-device face scan to suggest mask shapes that suit your face.</p>
      </Link>

      <div className="mt-8">
        <DiverProfileForm
          userId={user.id}
          initial={profile as DiverProfile | null}
          agencies={(agencies ?? []) as CertificationAgency[]}
          certifications={(certifications ?? []) as Certification[]}
          species={(species ?? []) as MarineSpecies[]}
        />
      </div>
    </main>
  );
}
