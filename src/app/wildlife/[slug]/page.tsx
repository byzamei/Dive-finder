import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getDestinationsForSpecies,
  getSeasonalityForSpecies,
  getSitesForSpecies,
  getSpeciesBySlug,
} from "@/lib/services/wildlifeService";
import { SuitabilityBadge } from "@/components/badges/DataBadges";
import { DemoDataBadge } from "@/components/badges/DataBadges";
import { monthName } from "@/lib/utils/format";
import { SpeciesSeenToggle } from "@/components/wildlife/SpeciesSeenToggle";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = await createClient();
  const species = await getSpeciesBySlug(supabase, params.slug);
  if (!species) return {};
  return { title: species.common_name, description: `Where to see ${species.common_name} (${species.scientific_name}).` };
}

export default async function SpeciesPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const species = await getSpeciesBySlug(supabase, params.slug);
  if (!species) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [destinations, sites, seasonality, seenRow] = await Promise.all([
    getDestinationsForSpecies(supabase, species.id),
    getSitesForSpecies(supabase, species.id),
    getSeasonalityForSpecies(supabase, species.id),
    user
      ? supabase.from("user_species_seen").select("id").eq("user_id", user.id).eq("species_id", species.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const siteDestinationSlugs = new Set(sites.map((s) => s.destination_slug));
  const destinationsWithoutASite = destinations.filter((d) => !siteDestinationSlugs.has(d.slug));
  const showDestinationsSection = sites.length === 0 || destinationsWithoutASite.length > 0;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/wildlife" className="focus-ring text-sm text-ocean-700 hover:underline">
        ← Wildlife
      </Link>
      <h1 className="mt-2 font-display text-3xl text-abyss-900">{species.common_name}</h1>
      <p className="mt-1 italic text-abyss-400">{species.scientific_name}</p>

      <div className="mt-4">
        <SpeciesSeenToggle userId={user?.id ?? null} speciesId={species.id} initialSeen={Boolean(seenRow.data)} />
      </div>

      {sites.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl text-abyss-900">Dive sites</h2>
          <p className="mt-1 text-xs text-abyss-400">The specific spots divers report seeing it — the most precise answer to &ldquo;where.&rdquo;</p>
          <ul className="mt-3 space-y-2">
            {sites.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/sites/${s.slug}`}
                  className="focus-ring flex items-center justify-between rounded-lg border border-abyss-100 px-4 py-3 text-sm hover:bg-abyss-50"
                >
                  <span>
                    <span className="font-medium text-abyss-900">{s.name}</span>
                    <span className="ml-1.5 text-abyss-400">— {s.destination_name}</span>
                  </span>
                  {s.demo_data && <DemoDataBadge />}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {showDestinationsSection && (
        <section className="mt-8">
          <h2 className="font-display text-xl text-abyss-900">Destinations</h2>
          {destinationsWithoutASite.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {destinationsWithoutASite.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/destinations/${d.slug}`}
                    className="focus-ring flex items-center justify-between rounded-lg border border-abyss-100 px-4 py-3 text-sm hover:bg-abyss-50"
                  >
                    <span className="font-medium text-abyss-900">{d.name}</span>
                    {d.demo_data && <DemoDataBadge />}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm italic text-abyss-400">
              No destination in DiveFinder has a verified association with this species yet — browse{" "}
              <Link href="/explore" className="text-ocean-600 underline not-italic">
                the full catalog
              </Link>{" "}
              in the meantime.
            </p>
          )}
        </section>
      )}

      {seasonality.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl text-abyss-900">Qualitative seasonal calendar</h2>
          <p className="mt-1 text-xs text-abyss-400">
            Suitability is a qualitative rating, never a sighting probability — see docs/scoring.md.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
              const row = seasonality.find((s) => s.month === month);
              return (
                <div key={month} className="rounded-lg border border-abyss-100 p-3 text-center">
                  <p className="text-xs text-abyss-400">{monthName(month)}</p>
                  <div className="mt-1">
                    <SuitabilityBadge suitability={row?.suitability ?? "unknown"} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
