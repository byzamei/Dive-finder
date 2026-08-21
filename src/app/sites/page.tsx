import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listPublishedDestinations, listPublishedSitesPage } from "@/lib/services/destinationService";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/badges/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { SitesFilterBar } from "@/components/sites/SitesFilterBar";
import type { AccessType } from "@/lib/types/domain";

export const metadata: Metadata = {
  title: "Dive sites",
  description: "Browse individual dive sites (spots) across every DiveFinder destination.",
};

const PAGE_SIZE = 24;

export default async function SitesPage({
  searchParams,
}: {
  searchParams: { destination?: string; access?: string; page?: string };
}) {
  const supabase = await createClient();
  const page = Math.max(1, Number(searchParams.page) || 1);

  const [{ sites: visible, total }, destinations] = await Promise.all([
    listPublishedSitesPage(supabase, {
      destinationId: searchParams.destination || undefined,
      accessType: (searchParams.access as AccessType) || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    listPublishedDestinations(supabase),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function buildHref(nextPage: number) {
    const params = new URLSearchParams();
    if (searchParams.destination) params.set("destination", searchParams.destination);
    if (searchParams.access) params.set("access", searchParams.access);
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `/sites?${qs}` : "/sites";
  }

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
        <>
          <p className="mt-6 text-sm text-abyss-500">
            {total} site{total === 1 ? "" : "s"}
          </p>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
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
          <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
        </>
      )}
    </main>
  );
}

function accessLabel(access: AccessType | null): string {
  return access ? access.charAt(0).toUpperCase() + access.slice(1) : "Access unknown";
}
