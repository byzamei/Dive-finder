"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { addClaim, setClaimReviewStatus } from "@/lib/services/dataClaimService";
import type { Confidence } from "@/lib/types/domain";

export async function createClaimAction(formData: FormData) {
  const supabase = await createClient();
  const rawValue = String(formData.get("value_json"));
  let value_json: unknown = rawValue;
  try {
    value_json = JSON.parse(rawValue);
  } catch {
    // Keep as plain string if it's not valid JSON (e.g. "Advanced Open Water").
  }

  await addClaim(supabase, {
    entity_type: String(formData.get("entity_type")),
    entity_id: String(formData.get("entity_id")),
    field_name: String(formData.get("field_name")),
    value_json,
    unit: (formData.get("unit") as string) || null,
    source_id: (formData.get("source_id") as string) || null,
    confidence: (formData.get("confidence") as Confidence) || "medium",
    expires_at: (formData.get("expires_at") as string) || null,
    observed_at: new Date().toISOString(),
  });
  revalidatePath("/admin/claims");
}

export async function setClaimStatusAction(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as "verified" | "rejected";
  await setClaimReviewStatus(supabase, id, status);
  revalidatePath("/admin/claims");
}
