import type { MaskMatch } from "@/lib/types/domain";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/badges/Badge";
import { SuitabilityBadge } from "@/components/badges/DataBadges";

export function MaskMatchCard({ match }: { match: MaskMatch }) {
  const { mask, suitability, reasons } = match;
  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-lg text-abyss-900">
              {mask.brand} {mask.name}
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              <Badge tone="neutral">{mask.lens_type}</Badge>
              <Badge tone="neutral">{mask.volume_category} volume</Badge>
            </div>
          </div>
          <SuitabilityBadge suitability={suitability} />
        </div>
        {reasons.length > 0 && (
          <ul className="mt-3 list-inside list-disc text-sm text-abyss-600">
            {reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
