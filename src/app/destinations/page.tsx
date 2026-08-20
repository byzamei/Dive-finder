import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/badges/Badge";
import { DemoDataBadge } from "@/components/badges/DataBadges";

export const metadata: Metadata = {
  title: "Destinations",
  description: "Browse every published dive destination in DiveFinder's catalog.",
};

interface DestinationRow {
  id: string;
  slug: string;
  name: string;
  dive_type_tags: string[];
  demo_data: boolean;
  countries: { name: string } | null;
}

export default async function DestinationsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("destinations")
    .select("id, slug, name, dive_type_tags, demo_data, countries(name)")
    .eq("status", "published")
    .order("name");

  const destinations = (data ?? []) as unknown as DestinationRow[];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-3xl text-abyss-900">Destinations</h1>
      <p className="mt-2 text-abyss-500">Every published destination in the catalog, browsable directly.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {destinations.map((d) => (
          <Link key={d.id} href={`/destinations/${d.slug}`} className="focus-ring block">
            <Card>
              <CardBody>
                <div className="flex items-center gap-2">
                  <p className="font-display text-lg text-abyss-900">{d.name}</p>
                  {d.demo_data && <DemoDataBadge />}
                </div>
                {d.countries?.name && <p className="mt-0.5 text-sm text-abyss-500">{d.countries.name}</p>}
                {d.dive_type_tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {d.dive_type_tags.map((t) => (
                      <Badge key={t} tone="neutral">
                        {t.replace("_", " ")}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
