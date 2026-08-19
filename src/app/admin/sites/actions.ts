"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createSiteAction(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("dive_sites").insert({
    slug: String(formData.get("slug")),
    destination_id: String(formData.get("destination_id")),
    name: String(formData.get("name")),
    access_type: (formData.get("access_type") as string) || null,
    min_depth_m: formData.get("min_depth_m") ? Number(formData.get("min_depth_m")) : null,
    max_depth_m: formData.get("max_depth_m") ? Number(formData.get("max_depth_m")) : null,
    typical_current: (formData.get("typical_current") as string) || null,
    recommended_level: (formData.get("recommended_level") as string) || null,
    status: (formData.get("status") as string) || "draft",
    demo_data: formData.get("demo_data") === "on",
  });
  if (error) throw error;
  revalidatePath("/admin/sites");
}
