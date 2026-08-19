"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createDataSource } from "@/lib/services/dataClaimService";
import type { DataSource } from "@/lib/types/domain";

export async function createSourceAction(formData: FormData) {
  const supabase = await createClient();
  await createDataSource(supabase, {
    name: String(formData.get("name")),
    source_type: String(formData.get("source_type")) as DataSource["source_type"],
    url: (formData.get("url") as string) || null,
    reliability: (formData.get("reliability") as DataSource["reliability"]) || "medium",
    notes: (formData.get("notes") as string) || null,
  });
  revalidatePath("/admin/sources");
}
