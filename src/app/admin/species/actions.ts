"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createSpeciesAction(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("marine_species").insert({
    slug: String(formData.get("slug")),
    common_name: String(formData.get("common_name")),
    scientific_name: String(formData.get("scientific_name")),
    category: (formData.get("category") as string) || null,
  });
  if (error) throw error;
  revalidatePath("/admin/species");
}
