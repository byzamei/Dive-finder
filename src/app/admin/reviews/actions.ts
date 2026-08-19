"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { setReviewStatus } from "@/lib/services/reviewService";

export async function moderateReview(formData: FormData) {
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as "published" | "rejected";
  const supabase = await createClient();
  await setReviewStatus(supabase, id, status);
  revalidatePath("/admin/reviews");
}
