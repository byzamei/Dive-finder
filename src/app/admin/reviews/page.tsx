import { createClient } from "@/lib/supabase/server";
import { listPendingReviews } from "@/lib/services/reviewService";
import { StarRating } from "@/components/reviews/StarRating";
import { Badge } from "@/components/badges/Badge";
import { moderateReview } from "./actions";

export default async function AdminReviewsPage() {
  const supabase = await createClient();
  const reviews = await listPendingReviews(supabase);

  const destinationIds = reviews.filter((r) => r.entity_type === "destination").map((r) => r.entity_id);
  const siteIds = reviews.filter((r) => r.entity_type === "site").map((r) => r.entity_id);

  const [{ data: destinations }, { data: sites }] = await Promise.all([
    destinationIds.length ? supabase.from("destinations").select("id, name").in("id", destinationIds) : Promise.resolve({ data: [] }),
    siteIds.length ? supabase.from("dive_sites").select("id, name").in("id", siteIds) : Promise.resolve({ data: [] }),
  ]);
  const nameById = new Map<string, string>([
    ...((destinations ?? []) as { id: string; name: string }[]).map((d) => [d.id, d.name] as const),
    ...((sites ?? []) as { id: string; name: string }[]).map((s) => [s.id, s.name] as const),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-abyss-900">Diver reviews — pending moderation</h1>
      <p className="mt-1 text-sm text-abyss-500">
        Approve to publish (feeds the Reviews scoring dimension), or reject if it doesn&apos;t meet guidelines.
      </p>

      {reviews.length === 0 ? (
        <p className="mt-6 text-sm text-abyss-500">Nothing pending right now.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-xl2 border border-abyss-100 bg-white p-4 shadow-card">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral">{r.entity_type}</Badge>
                <span className="text-sm font-medium text-abyss-900">{nameById.get(r.entity_id) ?? r.entity_id.slice(0, 8)}</span>
                <StarRating value={r.rating ?? 0} />
              </div>
              {r.note && <p className="mt-2 text-sm text-abyss-600">{r.note}</p>}
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-abyss-500">
                {r.dive_date && <span>Dove {r.dive_date}</span>}
                {r.visibility_bucket && <span>· Visibility: {r.visibility_bucket}</span>}
                {r.current_bucket && <span>· Current: {r.current_bucket}</span>}
                {r.water_temp_c != null && <span>· {r.water_temp_c}°C</span>}
                {r.operator_name && <span>· Operator: {r.operator_name}</span>}
              </div>
              <div className="mt-3 flex gap-2">
                <form action={moderateReview}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="status" value="published" />
                  <button className="focus-ring rounded-full bg-seaglass-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-seaglass-700">
                    Publish
                  </button>
                </form>
                <form action={moderateReview}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="status" value="rejected" />
                  <button className="focus-ring rounded-full border border-abyss-200 px-3 py-1.5 text-xs font-medium text-abyss-600 hover:bg-abyss-50">
                    Reject
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
