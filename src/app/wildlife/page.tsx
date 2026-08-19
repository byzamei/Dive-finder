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

export default async function WildlifePage() {
  const supabase = await createClient();
  const species = await listSpecies(supabase);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-3xl text-abyss-900">Wildlife</h1>
      <p className="mt-2 text-abyss-500">
        Browse by species, then jump into Discover with that animal pre-selected.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {species.map((s) => (
          <Link key={s.id} href={`/wildlife/${s.slug}`} className="focus-ring block">
            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-lg text-abyss-900">{s.common_name}</p>
                    <p className="text-sm italic text-abyss-400">{s.scientific_name}</p>
                  </div>
                  {s.category && <Badge tone="neutral">{s.category}</Badge>}
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
