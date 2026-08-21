import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { getDiveLogEntry } from "@/lib/services/diveLogService";
import { listPublishedSites } from "@/lib/services/destinationService";
import { DiveLogForm } from "@/components/logbook/DiveLogForm";
import type { MarineSpecies } from "@/lib/types/domain";

export const metadata: Metadata = { title: "Edit dive log entry" };

export default async function EditDiveLogEntryPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const supabase = await createClient();

  const [entry, sites, { data: species }] = await Promise.all([
    getDiveLogEntry(supabase, params.id),
    listPublishedSites(supabase),
    supabase.from("marine_species").select("*").order("common_name"),
  ]);

  if (!entry || entry.user_id !== user.id) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-display text-3xl text-abyss-900">Edit dive</h1>
      <p className="mt-2 text-abyss-500">Private by default — share it from the form below if you want to.</p>
      <div className="mt-8">
        <DiveLogForm userId={user.id} sites={sites} species={(species ?? []) as MarineSpecies[]} existing={entry} />
      </div>
    </main>
  );
}
