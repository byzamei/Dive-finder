"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveReviewQueueItem } from "@/lib/services/dataClaimService";

export async function resolveReviewItem(formData: FormData) {
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as "resolved" | "dismissed";
  const supabase = await createClient();
  await resolveReviewQueueItem(supabase, id, status);
  revalidatePath("/admin/review");
}
