"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DiveTypeTag } from "@/lib/types/domain";

export async function createDestinationAction(formData: FormData) {
  const supabase = await createClient();
  const tags = String(formData.get("dive_type_tags") || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean) as DiveTypeTag[];

  const { error } = await supabase.from("destinations").insert({
    slug: String(formData.get("slug")),
    name: String(formData.get("name")),
    summary: (formData.get("summary") as string) || null,
    dive_type_tags: tags,
    status: (formData.get("status") as string) || "draft",
    demo_data: formData.get("demo_data") === "on",
  });
  if (error) throw error;
  revalidatePath("/admin/destinations");
}

export async function toggleDestinationStatusAction(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  await supabase.from("destinations").update({ status }).eq("id", id);
  revalidatePath("/admin/destinations");
}
