import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDiveSiteBySlug, getVerifiedClaims } from "@/lib/services/destinationService";
import { listPublishedReviews, getUserReviewForEntity } from "@/lib/services/reviewService";
import { Badge } from "@/components/badges/Badge";
import { FreshnessBadge, VerifiedAgoBadge } from "@/components/badges/DataBadges";
import { SafetyNotice } from "@/components/SafetyNotice";
import { ReviewsList } from "@/components/reviews/ReviewsList";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { featureFlags } from "@/lib/utils/featureFlags";
import { buildPageMetadata } from "@/lib/utils/metadata";
import { searchDestinationPhoto } from "@/lib/services/photoService";
import { isFavorited } from "@/lib/services/favoriteService";
import { SaveButton } from "@/components/favorites/SaveButton";
import type { MarineSpecies } from "@/lib/types/domain";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = await createClient();
  const site = await getDiveSiteBySlug(supabase, params.slug);
  if (!site) return {};
  const { data: destination } = await supabase
    .from("destinations")
    .select("name")
    .eq("id", site.destination_id)
    .maybeSingle();
  const photo = site.demo_data
    ? null
    : await searchDestinationPhoto(`${site.name}${destination ? ` ${destination.name}` : ""} diving`);
  return buildPageMetadata({
    title: site.name,
    description: destination
      ? `Dive site information for ${site.name} in ${destination.name} on DiveFinder.`
      : `Dive site information for ${site.name} on DiveFinder.`,
    imageUrl: photo?.url,
  });
}

export default async function DiveSitePage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const site = await getDiveSiteBySlug(supabase, params.slug);
  if (!site) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetched first (not in the Promise.all below) so its name can sharpen
  // the photo search query — many site names alone are ambiguous or shared
  // across destinations (e.g. more than one "Manta Point").
  const { data: destination } = await supabase
    .from("destinations")
    .select("id, name, slug")
    .eq("id", site.destination_id)
    .maybeSingle();

  const [claims, { data: siteSpecies }, reviews, userReview, { data: allSpecies }, photo, saved] = await Promise.all([
    getVerifiedClaims(supabase, "dive_site", site.id),
    supabase.from("site_species").select("marine_species(id, slug, common_name)").eq("site_id", site.id),
    listPublishedReviews(supabase, "site", site.id),
    user ? getUserReviewForEntity(supabase, user.id, "site", site.id) : Promise.resolve(null),
    supabase.from("marine_species").select("*").order("common_name"),
    site.demo_data
      ? Promise.resolve(null)
      : searchDestinationPhoto(`${site.name}${destination ? ` ${destination.name}` : ""} diving`),
    user ? isFavorited(supabase, user.id, "site", site.id) : Promise.resolve(false),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      {photo && (
        <figure className="mb-6 overflow-hidden rounded-xl2">
          <div className="relative h-48 w-full sm:h-60">
            <Image src={photo.url} alt={photo.alt} fill priority sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
          </div>
          <figcaption className="mt-1.5 text-right text-xs text-abyss-400">
            Photo by{" "}
            <a href={photo.photographerUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-abyss-600">
              {photo.photographer}
            </a>{" "}
            on Pexels
          </figcaption>
        </figure>
      )}

      {destination && (
        <Link href={`/destinations/${destination.slug}`} className="focus-ring text-sm text-ocean-700 hover:underline">
          ← {destination.name}
        </Link>
      )}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-3xl text-abyss-900">{site.name}</h1>
        <SaveButton userId={user?.id ?? null} entityType="site" entityId={site.id} initialSaved={saved} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Access" value={site.access_type ?? "Unknown"} />
        <Field label="Depth" value={site.max_depth_m != null ? `${site.min_depth_m ?? 0}–${site.max_depth_m}m` : "Unknown"} />
        <Field label="Current" value={site.typical_current ?? "Unknown"} />
        <Field
          label="Visibility"
          value={
            site.typical_visibility_m_min != null
              ? `${site.typical_visibility_m_min}–${site.typical_visibility_m_max}m`
              : "Unknown"
          }
        />
        <Field label="Recommended level" value={site.recommended_level ?? "Unknown — check operator requirements"} />
        <Field label="Type" value={site.site_type.length ? site.site_type.join(", ") : "Unknown"} />
      </div>

      {site.hazards && site.hazards.length > 0 && (
        <div className="mt-6 rounded-xl2 border border-coral-400/30 bg-coral-400/5 p-4">
          <p className="text-sm font-semibold text-coral-600">Hazards</p>
          <ul className="mt-1 list-inside list-disc text-sm text-abyss-700">
            {site.hazards.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="mt-8">
        <h2 className="font-display text-xl text-abyss-900">Wildlife at this site</h2>
        {siteSpecies && siteSpecies.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {(siteSpecies as unknown as { marine_species: { id: string; slug: string; common_name: string } }[]).map(
              (row) => (
                <li key={row.marine_species.id}>
                  <Link href={`/wildlife/${row.marine_species.slug}`}>
                    <Badge tone="info">{row.marine_species.common_name}</Badge>
                  </Link>
                </li>
              )
            )}
          </ul>
        ) : (
          <p className="mt-2 text-sm italic text-abyss-400">No verified species observations logged yet.</p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl text-abyss-900">Sources & freshness</h2>
        {claims.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {claims.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-abyss-100 px-4 py-2.5 text-sm">
                <span className="font-medium text-abyss-800">{c.field_name.replace("_", " ")}</span>
                <VerifiedAgoBadge verifiedAt={c.verified_at} />
                <FreshnessBadge expiresAt={c.expires_at} sourceType={c.source_type} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm italic text-abyss-400">No sourced claims recorded yet for this site.</p>
        )}
      </section>

      {featureFlags.communityReviewSubmission && (
        <section className="mt-8">
          <h2 className="font-display text-xl text-abyss-900">Diver reviews</h2>
          <ReviewsList reviews={reviews} species={(allSpecies ?? []) as MarineSpecies[]} />
          <ReviewForm
            userId={user?.id ?? null}
            entityType="site"
            entityId={site.id}
            species={(allSpecies ?? []) as MarineSpecies[]}
            existingReview={userReview}
          />
        </section>
      )}

      <div className="mt-10 rounded-xl2 border border-abyss-100 bg-sand-100 p-4">
        <SafetyNotice />
      </div>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-abyss-400">{label}</p>
      <p className="mt-0.5 font-medium capitalize text-abyss-900">{value}</p>
    </div>
  );
}
