import { createClient } from "@/lib/supabase/server";
import { getDataHealthSummary, getDestinationCoverage, getDiveSiteCoverage } from "@/lib/services/dataHealthService";
import { listExpiredClaims } from "@/lib/services/dataClaimService";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/badges/Badge";

export default async function DataHealthPage() {
  const supabase = await createClient();
  const [summary, destCoverage, siteCoverage, expiredClaims] = await Promise.all([
    getDataHealthSummary(supabase),
    getDestinationCoverage(supabase),
    getDiveSiteCoverage(supabase),
    listExpiredClaims(supabase),
  ]);

  const incompleteDestinations = destCoverage.filter(
    (c) => c.critical_fields_total > 0 && c.critical_fields_sourced / c.critical_fields_total < 0.5
  );
  const incompleteSites = siteCoverage.filter(
    (c) => c.critical_fields_total > 0 && c.critical_fields_sourced / c.critical_fields_total < 0.5
  );

  return (
    <div>
      <h1 className="font-display text-2xl text-abyss-900">Data Health</h1>
      <p className="mt-1 text-sm text-abyss-500">
        Measures how much of the catalog is backed by verified, non-expired claims — see
        docs/data-governance.md.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <Metric label="Critical fields sourced" value={`${summary.critical_fields_sourced_pct}%`} />
        <Metric label="Fresh claims" value={`${summary.fresh_claims_pct}%`} />
        <Metric label="Destinations ready" value={summary.destinations_ready_count} />
        <Metric label="Dive sites ready" value={summary.dive_sites_ready_count} />
        <Metric label="Species with data" value={summary.species_ready_count} />
        <Metric label="Disputed claims" value={summary.disputed_claims_count} tone={summary.disputed_claims_count > 0 ? "warning" : undefined} />
        <Metric
          label="Expired price claims"
          value={summary.expired_price_claims_count}
          tone={summary.expired_price_claims_count > 0 ? "warning" : undefined}
        />
        <Metric label="Open review items" value={summary.open_review_queue_count} tone={summary.open_review_queue_count > 0 ? "warning" : undefined} />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-lg text-abyss-900">Incomplete destinations</h2>
        <p className="text-xs text-abyss-400">Fewer than 50% of critical fields have a verified, non-expired claim.</p>
        <CoverageTable rows={incompleteDestinations} />
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg text-abyss-900">Incomplete dive sites</h2>
        <CoverageTable rows={incompleteSites} />
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg text-abyss-900">Expired claims</h2>
        {expiredClaims.length === 0 ? (
          <p className="mt-2 text-sm text-abyss-500">No expired claims outstanding.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {expiredClaims.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-abyss-100 px-4 py-2.5 text-sm">
                <Badge tone="warning">Expired</Badge>
                <span className="font-medium">{c.field_name}</span>
                <span className="text-abyss-400">{c.entity_type} · {c.entity_id.slice(0, 8)}</span>
                <span className="text-abyss-400">expired {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : ""}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string | number; tone?: "warning" }) {
  return (
    <Card>
      <CardBody>
        <p className="text-xs uppercase tracking-wide text-abyss-400">{label}</p>
        <p className={`mt-1 font-display text-2xl ${tone === "warning" ? "text-coral-600" : "text-abyss-900"}`}>{value}</p>
      </CardBody>
    </Card>
  );
}

function CoverageTable({ rows }: { rows: { name: string; critical_fields_total: number; critical_fields_sourced: number }[] }) {
  if (rows.length === 0) return <p className="mt-2 text-sm text-abyss-500">None — everything above the 50% threshold.</p>;
  return (
    <table className="mt-3 w-full text-left text-sm">
      <tbody>
        {rows.map((r) => (
          <tr key={r.name} className="border-t border-abyss-100">
            <td className="py-2">{r.name}</td>
            <td className="py-2 text-right text-abyss-500">
              {r.critical_fields_sourced}/{r.critical_fields_total} critical fields sourced
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
