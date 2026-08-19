import { createClient } from "@/lib/supabase/server";
import { createSpeciesAction } from "./actions";

export default async function AdminSpeciesPage() {
  const supabase = await createClient();
  const { data: species } = await supabase.from("marine_species").select("*").order("common_name");

  return (
    <div>
      <h1 className="font-display text-2xl text-abyss-900">Species</h1>

      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="text-abyss-400">
            <th className="py-2">Common name</th>
            <th className="py-2">Scientific name</th>
            <th className="py-2">Category</th>
          </tr>
        </thead>
        <tbody>
          {(species ?? []).map((s) => (
            <tr key={s.id} className="border-t border-abyss-100">
              <td className="py-2 font-medium text-abyss-900">{s.common_name}</td>
              <td className="py-2 italic text-abyss-500">{s.scientific_name}</td>
              <td className="py-2 text-abyss-600">{s.category ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="mt-10 rounded-xl2 border border-abyss-100 bg-sand-100 p-5">
        <h2 className="font-display text-lg text-abyss-900">New species</h2>
        <form action={createSpeciesAction} className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field name="common_name" label="Common name" required />
          <Field name="scientific_name" label="Scientific name" required />
          <Field name="slug" label="Slug" required />
          <label className="block">
            <span className="mb-1 block text-xs text-abyss-500">Category</span>
            <select name="category" className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-2 text-sm">
              <option value="">Unspecified</option>
              <option value="shark">Shark</option>
              <option value="ray">Ray</option>
              <option value="mammal">Mammal</option>
              <option value="turtle">Turtle</option>
              <option value="fish">Fish</option>
              <option value="other">Other</option>
            </select>
          </label>
          <div className="sm:col-span-2">
            <button className="focus-ring rounded-full bg-ocean-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-ocean-700">
              Add species
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Field({ name, label, required }: { name: string; label: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-abyss-500">{label}</span>
      <input name={name} required={required} className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-2 text-sm" />
    </label>
  );
}
