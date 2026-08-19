import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { listFavorites } from "@/lib/services/favoriteService";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardBody } from "@/components/ui/Card";
import { DemoDataBadge } from "@/components/badges/DataBadges";

export default async function SavedPage() {
  await requireUser();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const favorites = await listFavorites(supabase, user!.id);

  const destinationFavorites = favorites.filter((f) => f.entity_type === "destination");
  const { data: destinations } = destinationFavorites.length
    ? await supabase
        .from("destinations")
        .select("*")
        .in("id", destinationFavorites.map((f) => f.entity_id))
    : { data: [] };

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-display text-3xl text-abyss-900">Saved</h1>

      {!destinations || destinations.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No saved destinations yet"
            description="Save destinations from your search results to find them here."
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {destinations.map((d) => (
            <Link key={d.id} href={`/destinations/${d.slug}`} className="focus-ring block">
              <Card>
                <CardBody>
                  <div className="flex items-center gap-2">
                    <p className="font-display text-lg text-abyss-900">{d.name}</p>
                    {d.demo_data && <DemoDataBadge />}
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
