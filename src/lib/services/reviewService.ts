import type { SupabaseClient } from "@supabase/supabase-js";
import type { Review } from "@/lib/types/domain";

type ReviewEntityType = Review["entity_type"];

export async function listPublishedReviews(
  supabase: SupabaseClient,
  entityType: ReviewEntityType,
  entityId: string
): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Review[];
}

/** A user's own review for this entity, whatever its status — used to avoid duplicate submissions. */
export async function getUserReviewForEntity(
  supabase: SupabaseClient,
  userId: string,
  entityType: ReviewEntityType,
  entityId: string
): Promise<Review | null> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("user_id", userId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .maybeSingle();
  if (error) throw error;
  return data as Review | null;
}

export interface NewReview {
  userId: string;
  entityType: ReviewEntityType;
  entityId: string;
  rating: number;
  diveDate: string | null;
  visibilityBucket: string | null;
  currentBucket: string | null;
  waterTempC: number | null;
  speciesObserved: string[];
  operatorName: string | null;
  note: string | null;
}

export async function createReview(supabase: SupabaseClient, input: NewReview): Promise<void> {
  const { error } = await supabase.from("reviews").insert({
    user_id: input.userId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    rating: input.rating,
    dive_date: input.diveDate,
    visibility_bucket: input.visibilityBucket,
    current_bucket: input.currentBucket,
    water_temp_c: input.waterTempC,
    species_observed: input.speciesObserved,
    operator_name: input.operatorName,
    note: input.note,
    status: "pending",
  });
  if (error) throw error;
}

// ── Admin moderation ────────────────────────────────────────────────────

export async function listPendingReviews(supabase: SupabaseClient): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Review[];
}

export async function setReviewStatus(
  supabase: SupabaseClient,
  reviewId: string,
  status: "published" | "rejected"
): Promise<void> {
  const { error } = await supabase.from("reviews").update({ status }).eq("id", reviewId);
  if (error) throw error;
}
