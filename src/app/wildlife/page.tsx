import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listSpecies } from "@/lib/services/wildlifeService";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/badges/Badge";

export const metadata: Metadata = {
  title: "Wildlife",
  description: "Browse marine species and find out which destinations report them.",
};

export default async function WildlifePage({ searchParams }: { searchParams: { filter?: string } }) {
  const supabase = await createClient();
  const species = await listSpecies(supabase);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const seenIds = new Set<string>();
  if (user) {
    const { data } = await supabase.from("user_species_seen").select("species_id").eq("user_id", user.id);
    (data ?? []).forEach((r) => seenIds.add(r.species_id as string));
  }

  const filter = searchParams.filter === "seen" ? "seen" : "all";
  const visible = filter === "seen" ? species.filter((s) => seenIds.has(s.id)) : species;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-3xl text-abyss-900">Wildlife</h1>
      <p className="mt-2 text-abyss-500">
        Browse by species, then jump into Discover with that animal pre-selected.
      </p>

      {user && (
        <div className="mt-5 flex gap-2">
          <Link
            href="/wildlife"
            className={`focus-ring rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === "all" ? "bg-ocean-600 text-white" : "bg-abyss-100 text-abyss-700 hover:bg-abyss-200"
            }`}
          >
            All ({species.length})
          </Link>
          <Link
            href="/wildlife?filter=seen"
            className={`focus-ring rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === "seen" ? "bg-ocean-600 text-white" : "bg-abyss-100 text-abyss-700 hover:bg-abyss-200"
            }`}
          >
            My life list ({seenIds.size})
          </Link>
        </div>
      )}

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
                    {seenIds.has(s.id) && <Badge tone="success">Seen</Badge>}
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
