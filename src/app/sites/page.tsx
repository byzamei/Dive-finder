import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listPublishedDestinations, listPublishedSites } from "@/lib/services/destinationService";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/badges/Badge";
import { SitesFilterBar } from "@/components/sites/SitesFilterBar";
import type { AccessType } from "@/lib/types/domain";

export const metadata: Metadata = {
  title: "Dive sites",
  description: "Browse individual dive sites (spots) across every DiveFinder destination.",
};

export default async function SitesPage({
  searchParams,
}: {
  searchParams: { destination?: string; access?: string };
}) {
  const supabase = await createClient();
  const [sites, destinations] = await Promise.all([listPublishedSites(supabase), listPublishedDestinations(supabase)]);

  const visible = sites.filter((s) => {
    if (searchParams.destination && s.destination_id !== searchParams.destination) return false;
    if (searchParams.access && s.access_type !== searchParams.access) return false;
    return true;
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-3xl text-abyss-900">Dive sites</h1>
      <p className="mt-2 text-abyss-500">
        Every published spot across DiveFinder&apos;s destinations — filter by destination or access type.
      </p>

      <SitesFilterBar destinations={destinations} />

      {visible.length === 0 ? (
        <p className="mt-8 text-sm italic text-abyss-400">No dive sites match these filters yet.</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {visible.map((site) => (
            <Link key={site.id} href={`/sites/${site.slug}`} className="focus-ring block">
              <Card>
                <CardBody>
                  <p className="font-display text-lg text-abyss-900">{site.name}</p>
                  <p className="mt-0.5 text-sm text-abyss-500">{site.destination_name}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge tone="neutral">{accessLabel(site.access_type)}</Badge>
                    <Badge tone="neutral">
                      {site.max_depth_m != null ? `${site.min_depth_m ?? 0}–${site.max_depth_m}m` : "Depth unknown"}
                    </Badge>
                    {site.typical_current && <Badge tone="neutral">{site.typical_current} current</Badge>}
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

function accessLabel(access: AccessType | null): string {
  return access ? access.charAt(0).toUpperCase() + access.slice(1) : "Access unknown";
}
