import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDataHealthSummary } from "@/lib/services/dataHealthService";
import { Card, CardBody } from "@/components/ui/Card";

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const summary = await getDataHealthSummary(supabase);

  return (
    <div>
      <h1 className="font-display text-2xl text-abyss-900">Admin overview</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Published destinations" value={summary.published_destinations_count} />
        <Stat label="Critical fields sourced" value={`${summary.critical_fields_sourced_pct}%`} />
        <Stat label="Open review items" value={summary.open_review_queue_count} href="/admin/review" />
      </div>
      <p className="mt-6 text-sm text-abyss-500">
        Start with <Link href="/admin/data-health" className="text-ocean-700 underline">Data Health</Link> for a full
        picture, or the <Link href="/admin/review" className="text-ocean-700 underline">review queue</Link> for items
        needing attention right now.
      </p>
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: string | number; href?: string }) {
  const content = (
    <Card>
      <CardBody>
        <p className="text-xs uppercase tracking-wide text-abyss-400">{label}</p>
        <p className="mt-1 font-display text-3xl text-abyss-900">{value}</p>
      </CardBody>
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
