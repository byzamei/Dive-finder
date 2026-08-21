import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Divers",
  description: "Find other divers on DiveFinder and see what they've been diving.",
};

export default async function DiversIndexPage() {
  const supabase = await createClient();
  // RLS already limits this to public (or followers-if-following) profiles —
  // no extra filter needed here, it's just what the query is allowed to see.
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, bio, home_base")
    .not("display_name", "is", null)
    .order("created_at", { ascending: false })
    .limit(60);

  const divers = data ?? [];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-3xl text-abyss-900">Divers</h1>
      <p className="mt-2 text-abyss-500">Browse public profiles and see what other divers have been up to.</p>

      {divers.length === 0 ? (
        <p className="mt-8 text-sm italic text-abyss-400">No public profiles yet.</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {divers.map((d) => (
            <Link key={d.id} href={`/divers/${d.id}`} className="focus-ring block">
              <Card>
                <CardBody>
                  <div className="flex items-center gap-3">
                    {d.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={d.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ocean-50 font-display text-ocean-700">
                        {(d.display_name ?? "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium text-abyss-900">{d.display_name}</p>
                      {d.home_base && <p className="truncate text-sm text-abyss-500">{d.home_base}</p>}
                    </div>
                  </div>
                  {d.bio && <p className="mt-2 line-clamp-2 text-sm text-abyss-600">{d.bio}</p>}
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
