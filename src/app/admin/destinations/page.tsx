import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/badges/Badge";
import { createDestinationAction, toggleDestinationStatusAction } from "./actions";

export default async function AdminDestinationsPage() {
  const supabase = await createClient();
  const { data: destinations } = await supabase.from("destinations").select("*").order("demo_data").order("name");

  return (
    <div>
      <h1 className="font-display text-2xl text-abyss-900">Destinations</h1>

      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="text-abyss-400">
            <th className="py-2">Name</th>
            <th className="py-2">Status</th>
            <th className="py-2">Demo</th>
            <th className="py-2"> </th>
          </tr>
        </thead>
        <tbody>
          {(destinations ?? []).map((d) => (
            <tr key={d.id} className="border-t border-abyss-100">
              <td className="py-2 font-medium text-abyss-900">{d.name}</td>
              <td className="py-2">
                <Badge tone={d.status === "published" ? "success" : "neutral"}>{d.status}</Badge>
              </td>
              <td className="py-2">{d.demo_data && <Badge tone="demo">demo</Badge>}</td>
              <td className="py-2">
                <form action={toggleDestinationStatusAction}>
                  <input type="hidden" name="id" value={d.id} />
                  <input type="hidden" name="status" value={d.status === "published" ? "draft" : "published"} />
                  <button className="focus-ring text-xs text-ocean-700 underline">
                    {d.status === "published" ? "Unpublish" : "Publish"}
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="mt-10 rounded-xl2 border border-abyss-100 bg-sand-100 p-5">
        <h2 className="font-display text-lg text-abyss-900">New destination</h2>
        <form action={createDestinationAction} className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field name="name" label="Name" required />
          <Field name="slug" label="Slug" required placeholder="e.g. new-destination" />
          <div className="sm:col-span-2">
            <span className="mb-1 block text-xs text-abyss-500">Summary</span>
            <textarea name="summary" className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-2 text-sm" />
          </div>
          <Field name="dive_type_tags" label="Dive type tags (comma-separated)" placeholder="reef, wall, drift" />
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
              Create destination
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
