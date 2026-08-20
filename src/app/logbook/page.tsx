import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { computeDiveLogStats, listDiveLogEntries } from "@/lib/services/diveLogService";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardBody } from "@/components/ui/Card";
import { StarRating } from "@/components/reviews/StarRating";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Logbook",
  description: "Your personal dive log — private, never shared.",
};

export default async function LogbookPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const entries = await listDiveLogEntries(supabase, user.id);
  const stats = computeDiveLogStats(entries);

  const siteIds = Array.from(new Set(entries.map((e) => e.site_id).filter((id): id is string => id != null)));
  const { data: linkedSites } = siteIds.length
    ? await supabase.from("dive_sites").select("id, name").in("id", siteIds)
    : { data: [] };
  const siteNameById = new Map(((linkedSites ?? []) as { id: string; name: string }[]).map((s) => [s.id, s.name]));

  function siteLabel(entry: (typeof entries)[number]): string {
    return entry.site_name ?? (entry.site_id ? siteNameById.get(entry.site_id) ?? "Dive site" : "Dive site not specified");
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-abyss-900">Logbook</h1>
          <p className="mt-2 text-abyss-500">Your personal dive log — private, never shared publicly.</p>
        </div>
        <ButtonLink href="/logbook/new">Log a dive</ButtonLink>
      </div>

      {entries.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-3 rounded-xl2 border border-abyss-100 bg-white p-4 text-center shadow-card">
          <div>
            <p className="font-display text-lg text-abyss-900">{stats.totalDives}</p>
            <p className="text-xs text-abyss-400">Total dives</p>
          </div>
          <div>
            <p className="font-display text-lg text-abyss-900">
              {Math.floor(stats.totalBottomTimeMinutes / 60)}h{String(stats.totalBottomTimeMinutes % 60).padStart(2, "0")}
            </p>
            <p className="text-xs text-abyss-400">Bottom time</p>
          </div>
          <div>
            <p className="font-display text-lg text-abyss-900">{stats.deepestDiveM != null ? `${stats.deepestDiveM}m` : "—"}</p>
            <p className="text-xs text-abyss-400">Deepest dive</p>
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No dives logged yet"
            description="Log your dives to keep a private record — species you log are automatically added to your life list."
            action={<ButtonLink href="/logbook/new">Log your first dive</ButtonLink>}
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {entries.map((entry) => (
            <li key={entry.id}>
              <Link href={`/logbook/${entry.id}`} className="focus-ring block">
                <Card>
                  <CardBody>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-abyss-900">{siteLabel(entry)}</p>
                        <p className="mt-0.5 text-xs text-abyss-500">{entry.dive_date}</p>
                      </div>
                      {entry.rating != null && (
                        <div className="shrink-0">
                          <StarRating value={entry.rating} />
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-abyss-500">
                      {entry.max_depth_m != null && <span>{entry.max_depth_m}m</span>}
                      {entry.duration_minutes != null && <span>· {entry.duration_minutes} min</span>}
                      {entry.water_temp_c != null && <span>· {entry.water_temp_c}°C</span>}
                    </div>
                  </CardBody>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
