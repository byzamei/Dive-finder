import { createClient } from "@/lib/supabase/server";
import { listDataSources } from "@/lib/services/dataClaimService";
import { Badge } from "@/components/badges/Badge";
import { createSourceAction } from "./actions";

const SOURCE_TYPES = ["official_operator", "tourism_board", "scientific", "editorial", "community", "government", "other"];

export default async function SourcesPage() {
  const supabase = await createClient();
  const sources = await listDataSources(supabase);

  return (
    <div>
      <h1 className="font-display text-2xl text-abyss-900">Sources</h1>

      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="text-abyss-400">
            <th className="py-2">Name</th>
            <th className="py-2">Type</th>
            <th className="py-2">Reliability</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((s) => (
            <tr key={s.id} className="border-t border-abyss-100">
              <td className="py-2 font-medium text-abyss-900">{s.name}</td>
              <td className="py-2 text-abyss-600">{s.source_type}</td>
              <td className="py-2">
                <Badge tone={s.reliability === "high" ? "success" : s.reliability === "low" ? "warning" : "info"}>
                  {s.reliability}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="mt-10 rounded-xl2 border border-abyss-100 bg-sand-100 p-5">
        <h2 className="font-display text-lg text-abyss-900">Add a source</h2>
        <form action={createSourceAction} className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs text-abyss-500">Name</span>
            <input name="name" required className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-abyss-500">Type</span>
            <select name="source_type" className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-2 text-sm">
              {SOURCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-abyss-500">URL</span>
            <input name="url" type="url" className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-abyss-500">Reliability</span>
            <select name="reliability" className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-2 text-sm">
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
          <div className="sm:col-span-2">
            <span className="mb-1 block text-xs text-abyss-500">Notes</span>
            <textarea name="notes" className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <button className="focus-ring rounded-full bg-ocean-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-ocean-700">
              Add source
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
