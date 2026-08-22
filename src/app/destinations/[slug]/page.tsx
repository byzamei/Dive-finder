import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getDestinationBySlug,
  getDiveSitesForDestination,
  getSpeciesForDestination,
  getVerifiedClaims,
} from "@/lib/services/destinationService";
import { listPublishedReviews, getUserReviewForEntity } from "@/lib/services/reviewService";
import { listDiveCentersForDestination, listLiveaboardsForDestination, getPricesForEntities } from "@/lib/services/operatorService";
import { Badge } from "@/components/badges/Badge";
import { DemoDataBadge, VerifiedAgoBadge, FreshnessBadge } from "@/components/badges/DataBadges";
import { SafetyNotice } from "@/components/SafetyNotice";
import { ReviewsList } from "@/components/reviews/ReviewsList";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { DiveCentersSection, LiveaboardsSection } from "@/components/operators/OperatorsList";
import { featureFlags } from "@/lib/utils/featureFlags";
import { monthName } from "@/lib/utils/format";
import { Card, CardBody } from "@/components/ui/Card";
import { searchDestinationPhoto } from "@/lib/services/photoService";
import type { MarineSpecies } from "@/lib/types/domain";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = await createClient();
  const destination = await getDestinationBySlug(supabase, params.slug);
  if (!destination) return {};
  return {
    title: destination.name,
    description: destination.summary ?? `Dive planning information for ${destination.name} on DiveFinder.`,
  };
}

export default async function DestinationPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const destination = await getDestinationBySlug(supabase, params.slug);
  if (!destination) notFound();

  const [sites, species, claims, diveCenters, liveaboards, photo] = await Promise.all([
    getDiveSitesForDestination(supabase, destination.id),
    getSpeciesForDestination(supabase, destination.id),
    getVerifiedClaims(supabase, "destination", destination.id),
    listDiveCentersForDestination(supabase, destination.id),
    listLiveaboardsForDestination(supabase, destination.id),
    destination.demo_data ? Promise.resolve(null) : searchDestinationPhoto(`${destination.name} scuba diving`),
  ]);

  const [diveCenterPrices, liveaboardPrices] = await Promise.all([
    getPricesForEntities(supabase, "dive_center", diveCenters.map((c) => c.id)),
    getPricesForEntities(supabase, "liveaboard", liveaboards.map((l) => l.id)),
  ]);

  const { data: envSeasonality } = await supabase
    .from("environmental_seasonality")
    .select("*")
    .eq("destination_id", destination.id)
    .order("month");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [reviews, userReview, { data: allSpecies }] = await Promise.all([
    listPublishedReviews(supabase, "destination", destination.id),
    user ? getUserReviewForEntity(supabase, user.id, "destination", destination.id) : Promise.resolve(null),
    supabase.from("marine_species").select("*").order("common_name"),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      {photo && (
        <figure className="mb-6 overflow-hidden rounded-xl2">
          <div className="relative h-56 w-full sm:h-72">
            <Image src={photo.url} alt={photo.alt} fill priority sizes="(max-width: 896px) 100vw, 896px" className="object-cover" />
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

      <div className="mb-4 flex items-center gap-2">
        <h1 className="font-display text-3xl text-abyss-900">{destination.name}</h1>
        {destination.demo_data && <DemoDataBadge />}
      </div>

      <div className="flex flex-wrap gap-2">
        {destination.dive_type_tags.map((t) => (
          <Badge key={t} tone="neutral">
            {t.replace("_", " ")}
          </Badge>
        ))}
      </div>

      <p className="mt-4 max-w-2xl text-abyss-700">
        {destination.summary ?? (
          <span className="italic text-abyss-400">No verified summary yet — this destination is in DiveFinder&apos;s catalog but hasn&apos;t been reviewed by our data team.</span>
        )}
      </p>

      <section className="mt-8">
        <h2 className="font-display text-xl text-abyss-900">Monthly conditions</h2>
        {envSeasonality && envSeasonality.length > 0 ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="text-abyss-400">
                  <th className="py-2 pr-4">Month</th>
                  <th className="py-2 pr-4">Water temp</th>
                  <th className="py-2 pr-4">Visibility</th>
                </tr>
              </thead>
              <tbody>
                {envSeasonality.map((row) => (
                  <tr key={row.id} className="border-t border-abyss-100">
                    <td className="py-2 pr-4">{monthName(row.month)}</td>
                    <td className="py-2 pr-4">
                      {row.water_temp_c_min != null ? `${row.water_temp_c_min}–${row.water_temp_c_max}°C` : "Unknown"}
                    </td>
                    <td className="py-2 pr-4">
                      {row.visibility_m_min != null ? `${row.visibility_m_min}–${row.visibility_m_max}m` : "Unknown"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-sm italic text-abyss-400">No verified seasonal conditions yet.</p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl text-abyss-900">Wildlife</h2>
        {species.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {species.map((s) => (
              <li key={s.id}>
                <Link href={`/wildlife/${s.slug}`} className="focus-ring inline-block">
                  <Badge tone="info">{s.common_name}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm italic text-abyss-400">No verified species observations logged yet.</p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl text-abyss-900">Dive sites</h2>
        {sites.length > 0 ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {sites.map((site) => (
              <Link key={site.id} href={`/sites/${site.slug}`} className="focus-ring block">
                <Card>
                  <CardBody>
                    <p className="font-medium text-abyss-900">{site.name}</p>
                    <p className="mt-1 text-xs text-abyss-500">
                      {site.access_type ?? "Access unknown"} ·{" "}
                      {site.max_depth_m != null ? `${site.min_depth_m ?? 0}–${site.max_depth_m}m` : "Depth unknown"}
                    </p>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm italic text-abyss-400">No dive sites published for this destination yet.</p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl text-abyss-900">Dive centers</h2>
        <p className="mt-1 text-xs text-abyss-400">
          Listed alphabetically — never ranked or promoted. Booking happens on each operator&apos;s own site.
        </p>
        <DiveCentersSection centers={diveCenters} prices={diveCenterPrices} />
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl text-abyss-900">Liveaboards</h2>
        <p className="mt-1 text-xs text-abyss-400">
          Listed alphabetically — never ranked or promoted. Booking happens on each operator&apos;s own site.
        </p>
        <LiveaboardsSection liveaboards={liveaboards} prices={liveaboardPrices} />
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
                {c.review_status === "disputed" && <Badge tone="danger">Disputed — under review</Badge>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm italic text-abyss-400">No sourced claims recorded yet for this destination.</p>
        )}
      </section>

      {featureFlags.communityReviewSubmission && (
        <section className="mt-8">
          <h2 className="font-display text-xl text-abyss-900">Diver reviews</h2>
          <ReviewsList reviews={reviews} species={(allSpecies ?? []) as MarineSpecies[]} />
          <ReviewForm
            userId={user?.id ?? null}
            entityType="destination"
            entityId={destination.id}
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
