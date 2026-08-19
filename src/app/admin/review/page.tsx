import { createClient } from "@/lib/supabase/server";
import { listReviewQueue } from "@/lib/services/dataClaimService";
import { Badge } from "@/components/badges/Badge";
import { resolveReviewItem } from "./actions";

export default async function ReviewQueuePage() {
  const supabase = await createClient();
  const items = await listReviewQueue(supabase, "open");

  return (
    <div>
      <h1 className="font-display text-2xl text-abyss-900">Review queue</h1>
      <p className="mt-1 text-sm text-abyss-500">Expired claims, disputed data, missing fields, and new submissions.</p>

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-abyss-500">Nothing open right now.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl2 border border-abyss-100 bg-white p-4 shadow-card">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={item.reason === "disputed" ? "danger" : "warning"}>{item.reason.replace("_", " ")}</Badge>
                <span className="text-sm font-medium text-abyss-900">{item.entity_type}</span>
                <span className="text-xs text-abyss-400">{item.entity_id.slice(0, 8)}</span>
              </div>
              {item.notes && <p className="mt-2 text-sm text-abyss-600">{item.notes}</p>}
              <div className="mt-3 flex gap-2">
                <form action={resolveReviewItem}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="status" value="resolved" />
                  <button className="focus-ring rounded-full bg-seaglass-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-seaglass-700">
                    Mark resolved
                  </button>
                </form>
                <form action={resolveReviewItem}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="status" value="dismissed" />
                  <button className="focus-ring rounded-full border border-abyss-200 px-3 py-1.5 text-xs font-medium text-abyss-600 hover:bg-abyss-50">
                    Dismiss
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
