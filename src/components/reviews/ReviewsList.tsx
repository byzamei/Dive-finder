import type { MarineSpecies, Review } from "@/lib/types/domain";
import { StarRating } from "@/components/reviews/StarRating";
import { Badge } from "@/components/badges/Badge";
import { formatRelativeTime } from "@/lib/utils/format";

export function ReviewsList({ reviews, species }: { reviews: Review[]; species: MarineSpecies[] }) {
  if (reviews.length === 0) {
    return <p className="mt-2 text-sm italic text-abyss-400">No published diver reviews yet.</p>;
  }

  const speciesById = new Map(species.map((s) => [s.id, s]));
  const avg = reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviews.length;

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        <StarRating value={avg} size="md" />
        <span className="text-sm text-abyss-600">
          {avg.toFixed(1)} · {reviews.length} diver review{reviews.length > 1 ? "s" : ""}
        </span>
      </div>

      <ul className="mt-4 space-y-4">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-xl2 border border-abyss-100 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <StarRating value={r.rating ?? 0} />
                <span className="text-xs text-abyss-400">
                  A diver · {formatRelativeTime(r.created_at)}
                  {r.dive_date && ` · dove ${r.dive_date}`}
                </span>
              </div>
              <Badge tone="info">Community</Badge>
            </div>

            {(r.visibility_bucket || r.current_bucket || r.water_temp_c != null) && (
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                {r.visibility_bucket && <Badge tone="neutral">Visibility: {r.visibility_bucket}</Badge>}
                {r.current_bucket && <Badge tone="neutral">Current: {r.current_bucket}</Badge>}
                {r.water_temp_c != null && <Badge tone="neutral">{r.water_temp_c}°C</Badge>}
              </div>
            )}

            {r.note && <p className="mt-2 text-sm text-abyss-700">{r.note}</p>}

            {r.species_observed.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {r.species_observed.map((id) => {
                  const s = speciesById.get(id);
                  return s ? (
                    <Badge key={id} tone="success">
                      {s.common_name}
                    </Badge>
                  ) : null;
                })}
              </div>
            )}

            {r.operator_name && <p className="mt-2 text-xs text-abyss-400">Operator mentioned: {r.operator_name}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
