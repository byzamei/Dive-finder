import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { listPublishedSites } from "@/lib/services/destinationService";
import { DiveLogForm } from "@/components/logbook/DiveLogForm";
import type { MarineSpecies } from "@/lib/types/domain";

export const metadata: Metadata = { title: "Log a dive" };

export default async function NewDiveLogEntryPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [sites, { data: species }] = await Promise.all([
    listPublishedSites(supabase),
    supabase.from("marine_species").select("*").order("common_name"),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-display text-3xl text-abyss-900">Log a dive</h1>
      <p className="mt-2 text-abyss-500">Private by default — share it from the form below if you want to.</p>
      <div className="mt-8">
        <DiveLogForm userId={user.id} sites={sites} species={(species ?? []) as MarineSpecies[]} existing={null} />
      </div>
    </main>
  );
}
