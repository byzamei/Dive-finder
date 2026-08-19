import { Badge } from "./Badge";
import type { Confidence, Suitability } from "@/lib/types/domain";
import { formatRelativeTime } from "@/lib/utils/format";
import { isExpired } from "@/lib/utils/freshness";

// Freshness: Fresh (<TTL), Stale (past TTL / expired), Community (from an
// unmoderated community submission), Estimated (editorial/estimate, no hard
// source). Never renders a specific value as "current" once expired — see
// docs/data-governance.md.
export function FreshnessBadge({
  expiresAt,
  sourceType,
}: {
  expiresAt: string | null;
  sourceType?: string | null;
}) {
  if (sourceType === "community") return <Badge tone="info">Community</Badge>;
  if (sourceType === "demo") return <Badge tone="demo">Demo data</Badge>;
  if (!expiresAt) return <Badge tone="neutral">Estimated</Badge>;
  return isExpired(expiresAt) ? <Badge tone="warning">Stale</Badge> : <Badge tone="success">Fresh</Badge>;
}

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const label = { high: "High confidence", medium: "Medium confidence", low: "Low confidence" }[confidence];
  const tone = { high: "success", medium: "info", low: "warning" } as const;
  return <Badge tone={tone[confidence]}>{label}</Badge>;
}

export function VerifiedAgoBadge({ verifiedAt }: { verifiedAt: string | null }) {
  if (!verifiedAt) return <Badge tone="neutral">Not yet verified</Badge>;
  return <Badge tone="success">Verified {formatRelativeTime(verifiedAt)}</Badge>;
}

export function SuitabilityBadge({ suitability }: { suitability: Suitability }) {
  const config: Record<Suitability, { label: string; tone: "success" | "info" | "neutral" | "warning" }> = {
    excellent: { label: "Excellent", tone: "success" },
    good: { label: "Good", tone: "info" },
    possible: { label: "Possible", tone: "neutral" },
    low: { label: "Low", tone: "warning" },
    unknown: { label: "Unknown", tone: "neutral" },
  };
  const c = config[suitability];
  return <Badge tone={c.tone}>{c.label}</Badge>;
}

export function DemoDataBadge() {
  return <Badge tone="demo">Demo data — not real</Badge>;
}
