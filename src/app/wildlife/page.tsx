import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listSpecies } from "@/lib/services/wildlifeService";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/badges/Badge";
import type { SpeciesCategory } from "@/lib/types/domain";

export const metadata: Metadata = {
  title: "Wildlife",
  description: "Browse marine species and find out which destinations report them.",
};

const CATEGORIES: { value: SpeciesCategory; label: string }[] = [
  { value: "shark", label: "Sharks" },
  { value: "ray", label: "Rays" },
  { value: "mammal", label: "Mammals" },
  { value: "turtle", label: "Turtles" },
  { value: "fish", label: "Fish" },
  { value: "other", label: "Other" },
];

export default async function WildlifePage({
  searchParams,
}: {
  searchParams: { filter?: string; category?: string };
}) {
  const supabase = await createClient();
  const species = await listSpecies(supabase);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const seenOnById = new Map<string, string | null>();
  if (user) {
    const { data } = await supabase.from("user_species_seen").select("species_id, seen_on").eq("user_id", user.id);
    (data ?? []).forEach((r) => seenOnById.set(r.species_id as string, r.seen_on as string | null));
  }

  const filter = searchParams.filter === "seen" ? "seen" : "all";
  const category = CATEGORIES.some((c) => c.value === searchParams.category) ? (searchParams.category as SpeciesCategory) : null;

  const byFilter = filter === "seen" ? species.filter((s) => seenOnById.has(s.id)) : species;
  const byCategory = category ? byFilter.filter((s) => s.category === category) : byFilter;
  // My life list reads as a logbook: most recently seen first. The general
  // catalog stays alphabetical (listSpecies already orders by common_name).
  const visible =
    filter === "seen"
      ? [...byCategory].sort((a, b) => (seenOnById.get(b.id) ?? "").localeCompare(seenOnById.get(a.id) ?? ""))
      : byCategory;

  function withParams(overrides: { filter?: string; category?: string | null }) {
    const params = new URLSearchParams();
    const nextFilter = overrides.filter ?? filter;
    const nextCategory = overrides.category === undefined ? category : overrides.category;
    if (nextFilter === "seen") params.set("filter", "seen");
    if (nextCategory) params.set("category", nextCategory);
    const qs = params.toString();
    return qs ? `/wildlife?${qs}` : "/wildlife";
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-3xl text-abyss-900">Wildlife</h1>
      <p className="mt-2 text-abyss-500">
        Browse by species, then find every destination that reports it.
      </p>

      {user && (
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={withParams({ filter: "all" })}
            className={`focus-ring rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === "all" ? "bg-ocean-600 text-white" : "bg-abyss-100 text-abyss-700 hover:bg-abyss-200"
            }`}
          >
            All ({species.length})
          </Link>
          <Link
            href={withParams({ filter: "seen" })}
            className={`focus-ring rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === "seen" ? "bg-ocean-600 text-white" : "bg-abyss-100 text-abyss-700 hover:bg-abyss-200"
            }`}
          >
            My life list ({seenOnById.size})
          </Link>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={withParams({ category: null })}
          className={`focus-ring rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
            category === null ? "bg-abyss-900 text-white" : "bg-abyss-50 text-abyss-600 hover:bg-abyss-100"
          }`}
        >
          All categories
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.value}
            href={withParams({ category: c.value })}
            className={`focus-ring rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              category === c.value ? "bg-abyss-900 text-white" : "bg-abyss-50 text-abyss-600 hover:bg-abyss-100"
            }`}
          >
            {c.label}
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {visible.map((s) => (
          <Link key={s.id} href={`/wildlife/${s.slug}`} className="focus-ring block">
            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-lg text-abyss-900">{s.common_name}</p>
                    <p className="text-sm italic text-abyss-400">{s.scientific_name}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {seenOnById.has(s.id) && (
                      <Badge tone="success">{formatSeenOn(seenOnById.get(s.id) ?? null)}</Badge>
                    )}
                    {s.category && <Badge tone="neutral">{s.category}</Badge>}
                  </div>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}

function formatSeenOn(seenOn: string | null): string {
  if (!seenOn) return "Seen";
  return `Seen ${new Date(seenOn).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`;
}
