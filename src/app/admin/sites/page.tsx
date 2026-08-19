import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/badges/Badge";
import { createSiteAction } from "./actions";

export default async function AdminSitesPage() {
  const supabase = await createClient();
  const [{ data: sites }, { data: destinations }] = await Promise.all([
    supabase.from("dive_sites").select("*, destinations(name)").order("name"),
    supabase.from("destinations").select("id, name").order("name"),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-abyss-900">Dive sites</h1>

      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="text-abyss-400">
            <th className="py-2">Name</th>
            <th className="py-2">Destination</th>
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {((sites ?? []) as unknown as { id: string; name: string; status: string; destinations: { name: string } | null }[]).map(
            (s) => (
              <tr key={s.id} className="border-t border-abyss-100">
                <td className="py-2 font-medium text-abyss-900">{s.name}</td>
                <td className="py-2 text-abyss-600">{s.destinations?.name ?? "—"}</td>
                <td className="py-2">
                  <Badge tone={s.status === "published" ? "success" : "neutral"}>{s.status}</Badge>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>

      <section className="mt-10 rounded-xl2 border border-abyss-100 bg-sand-100 p-5">
        <h2 className="font-display text-lg text-abyss-900">New dive site</h2>
        <form action={createSiteAction} className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs text-abyss-500">Destination</span>
            <select name="destination_id" required className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-2 text-sm">
              {(destinations ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <Field name="name" label="Name" required />
          <Field name="slug" label="Slug" required />
          <label className="block">
            <span className="mb-1 block text-xs text-abyss-500">Access type</span>
            <select name="access_type" className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-2 text-sm">
              <option value="">Unknown</option>
              <option value="shore">Shore</option>
              <option value="boat">Boat</option>
              <option value="liveaboard">Liveaboard</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-abyss-500">Typical current</span>
            <select name="typical_current" className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-2 text-sm">
              <option value="">Unknown</option>
              <option value="none">None</option>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="strong">Strong</option>
              <option value="variable">Variable</option>
            </select>
          </label>
          <Field name="min_depth_m" label="Min depth (m)" />
          <Field name="max_depth_m" label="Max depth (m)" />
          <Field name="recommended_level" label="Recommended level" placeholder="e.g. Advanced Open Water" />
          <label className="block">
            <span className="mb-1 block text-xs text-abyss-500">Status</span>
            <select name="status" className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-2 text-sm">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>
          <label className="flex items-center gap-2 self-end text-sm text-abyss-700">
            <input type="checkbox" name="demo_data" /> Mark as demo data
          </label>
          <div className="sm:col-span-2">
            <button className="focus-ring rounded-full bg-ocean-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-ocean-700">
              Create site
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Field({ name, label, placeholder, required }: { name: string; label: string; placeholder?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-abyss-500">{label}</span>
      <input
        name={name}
        required={required}
        placeholder={placeholder}
        className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-2 text-sm"
      />
    </label>
  );
}
