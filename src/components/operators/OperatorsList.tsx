import type { DiveCenter, Liveaboard, Price } from "@/lib/types/domain";
import { Card, CardBody } from "@/components/ui/Card";
import { DemoDataBadge, FreshnessBadge } from "@/components/badges/DataBadges";
import { Badge } from "@/components/badges/Badge";
import { formatBudgetRange } from "@/lib/utils/format";

// Always sorted by name (server-side, via the *_for_destination service
// functions) — never by price, relevance, or anything that could read as
// promoting one operator over another. See docs/operators.md.

function OperatorPrices({ prices }: { prices: Price[] }) {
  if (prices.length === 0) return <p className="mt-1 text-xs text-abyss-400">No public price found yet.</p>;
  return (
    <div className="mt-2 space-y-1">
      {prices.map((p) => (
        <div key={p.id} className="flex flex-wrap items-center gap-2 text-xs text-abyss-600">
          <span className="font-medium text-abyss-800">{formatBudgetRange(p.amount_min, p.amount_max, p.currency)}</span>
          <span className="text-abyss-400">{p.price_type.replace("_", " ")}</span>
          <FreshnessBadge expiresAt={p.expires_at} />
        </div>
      ))}
    </div>
  );
}

export function DiveCentersSection({ centers, prices }: { centers: DiveCenter[]; prices: Map<string, Price[]> }) {
  if (centers.length === 0) {
    return <p className="mt-2 text-sm italic text-abyss-400">No dive center recorded for this destination yet.</p>;
  }
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {centers.map((c) => (
        <Card key={c.id}>
          <CardBody>
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-abyss-900">{c.name}</p>
              {c.demo_data && <DemoDataBadge />}
            </div>
            {c.center_type.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {c.center_type.map((t) => (
                  <Badge key={t} tone="neutral">
                    {t.replace("_", " ")}
                  </Badge>
                ))}
              </div>
            )}
            <OperatorPrices prices={prices.get(c.id) ?? []} />
            {c.website && (
              <a
                href={c.website}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="focus-ring mt-3 inline-block text-sm font-medium text-ocean-600 underline"
              >
                Visit their site →
              </a>
            )}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

export function LiveaboardsSection({ liveaboards, prices }: { liveaboards: Liveaboard[]; prices: Map<string, Price[]> }) {
  if (liveaboards.length === 0) {
    return <p className="mt-2 text-sm italic text-abyss-400">No liveaboard recorded for this destination yet.</p>;
  }
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {liveaboards.map((l) => (
        <Card key={l.id}>
          <CardBody>
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-abyss-900">{l.name}</p>
              {l.demo_data && <DemoDataBadge />}
            </div>
            {l.operator_name && <p className="mt-0.5 text-xs text-abyss-500">Operated by {l.operator_name}</p>}
            {l.itinerary_notes && <p className="mt-2 text-sm text-abyss-600">{l.itinerary_notes}</p>}
            <OperatorPrices prices={prices.get(l.id) ?? []} />
            {l.website && (
              <a
                href={l.website}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="focus-ring mt-3 inline-block text-sm font-medium text-ocean-600 underline"
              >
                Visit their site →
              </a>
            )}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
