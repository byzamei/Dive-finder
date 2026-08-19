import { createClient } from "@/lib/supabase/server";
import { listDataSources } from "@/lib/services/dataClaimService";
import { Badge } from "@/components/badges/Badge";
import { createClaimAction, setClaimStatusAction } from "./actions";

export default async function ClaimsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = await createClient();
  const status = searchParams.status ?? "pending";
  const [{ data: claims }, sources] = await Promise.all([
    supabase.from("data_claims").select("*").eq("review_status", status).order("created_at", { ascending: false }).limit(50),
    listDataSources(supabase),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-abyss-900">Claims</h1>

      <div className="mt-4 flex gap-2 text-sm">
        {["pending", "verified", "disputed", "rejected"].map((s) => (
          <a
            key={s}
            href={`/admin/claims?status=${s}`}
            className={`rounded-full px-3 py-1.5 ${status === s ? "bg-abyss-900 text-white" : "bg-abyss-100 text-abyss-600"}`}
          >
            {s}
          </a>
        ))}
      </div>

      <ul className="mt-6 space-y-3">
        {(claims ?? []).map((c) => (
          <li key={c.id} className="rounded-xl2 border border-abyss-100 bg-white p-4 shadow-card">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-abyss-900">{c.field_name}</span>
              <span className="text-abyss-400">{c.entity_type} · {String(c.entity_id).slice(0, 8)}</span>
              <Badge tone="neutral">{c.confidence}</Badge>
              {c.demo_data && <Badge tone="demo">demo</Badge>}
            </div>
            <p className="mt-1 text-sm text-abyss-600">value: {JSON.stringify(c.value_json)}</p>
            {status === "pending" && (
              <div className="mt-3 flex gap-2">
                <form action={setClaimStatusAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="status" value="verified" />
                  <button className="focus-ring rounded-full bg-seaglass-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-seaglass-700">
                    Approve
                  </button>
                </form>
                <form action={setClaimStatusAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="status" value="rejected" />
                  <button className="focus-ring rounded-full border border-abyss-200 px-3 py-1.5 text-xs font-medium text-abyss-600 hover:bg-abyss-50">
                    Reject
                  </button>
                </form>
              </div>
            )}
          </li>
        ))}
        {(!claims || claims.length === 0) && <p className="text-sm text-abyss-500">No {status} claims.</p>}
      </ul>

      <section className="mt-10 rounded-xl2 border border-abyss-100 bg-sand-100 p-5">
        <h2 className="font-display text-lg text-abyss-900">Add a claim</h2>
        <form action={createClaimAction} className="mt-3 grid gap-3 sm:grid-cols-2">
          <FormField name="entity_type" label="Entity type" placeholder="destination | dive_site" />
          <FormField name="entity_id" label="Entity ID (uuid)" />
          <FormField name="field_name" label="Field name" placeholder="e.g. recommended_level" />
          <FormField name="value_json" label="Value (JSON or plain text)" />
          <FormField name="unit" label="Unit" placeholder="optional" />
          <label className="block">
            <span className="mb-1 block text-xs text-abyss-500">Source</span>
            <select name="source_id" className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-2 text-sm">
              <option value="">Select a source…</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-abyss-500">Confidence</span>
            <select name="confidence" className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-2 text-sm">
              <option value="high">High</option>
              <option value="medium" selected>
                Medium
              </option>
              <option value="low">Low</option>
            </select>
          </label>
          <FormField name="expires_at" label="Expires at" type="date" />
          <div className="sm:col-span-2">
            <button className="focus-ring rounded-full bg-ocean-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-ocean-700">
              Add claim
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function FormField({ name, label, placeholder, type = "text" }: { name: string; label: string; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-abyss-500">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-2 text-sm"
      />
    </label>
  );
}
