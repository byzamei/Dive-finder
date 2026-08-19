import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminReviewQueueItem, DataClaim, DataSource } from "@/lib/types/domain";
import { claimsConflict } from "@/lib/utils/dataGovernance";

/**
 * Admin-only CRUD for the data governance model. Relies on the caller's
 * Supabase client already being authenticated as an admin — RLS
 * (0008_rls_policies.sql) enforces this server-side regardless.
 */

export async function listDataSources(supabase: SupabaseClient): Promise<DataSource[]> {
  const { data, error } = await supabase.from("data_sources").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as DataSource[];
}

export async function createDataSource(
  supabase: SupabaseClient,
  source: Omit<DataSource, "id">
): Promise<DataSource> {
  const { data, error } = await supabase.from("data_sources").insert(source).select().single();
  if (error) throw error;
  return data as DataSource;
}

export async function listClaimsForEntity(
  supabase: SupabaseClient,
  entityType: string,
  entityId: string
): Promise<DataClaim[]> {
  const { data, error } = await supabase
    .from("data_claims")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DataClaim[];
}

export async function listClaimsByReviewStatus(
  supabase: SupabaseClient,
  status: DataClaim["review_status"]
): Promise<DataClaim[]> {
  const { data, error } = await supabase
    .from("data_claims")
    .select("*")
    .eq("review_status", status)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DataClaim[];
}

export async function listExpiredClaims(supabase: SupabaseClient): Promise<DataClaim[]> {
  const { data, error } = await supabase
    .from("data_claims")
    .select("*")
    .not("expires_at", "is", null)
    .lte("expires_at", new Date().toISOString())
    .is("superseded_by", null)
    .order("expires_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DataClaim[];
}

export interface NewClaimInput {
  entity_type: string;
  entity_id: string;
  field_name: string;
  value_json: unknown;
  unit?: string | null;
  source_id?: string | null;
  source_type?: string | null;
  observed_at?: string | null;
  valid_from?: string | null;
  valid_to?: string | null;
  expires_at?: string | null;
  confidence: DataClaim["confidence"];
  demo_data?: boolean;
}

/**
 * Adds a new claim. When it contradicts an existing verified claim for the
 * same (entity, field), the OLD claim is kept — never deleted — and linked
 * via `superseded_by` only once an admin explicitly resolves the conflict
 * through `resolveConflict`. Simply adding a second claim for the same
 * field creates a visible conflict in the review queue rather than
 * silently overwriting history (see docs/data-governance.md).
 */
export async function addClaim(supabase: SupabaseClient, input: NewClaimInput): Promise<DataClaim> {
  const { data: existing } = await supabase
    .from("data_claims")
    .select("id, value_json")
    .eq("entity_type", input.entity_type)
    .eq("entity_id", input.entity_id)
    .eq("field_name", input.field_name)
    .eq("review_status", "verified")
    .is("superseded_by", null);

  const { data: created, error } = await supabase
    .from("data_claims")
    .insert({ ...input, review_status: "pending" })
    .select()
    .single();
  if (error) throw error;

  const conflicting = (existing ?? []).some((e) => claimsConflict(e.value_json, input.value_json));
  if (conflicting) {
    await supabase.from("admin_review_queue").insert({
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      claim_id: created.id,
      reason: "disputed",
      notes: `New claim for "${input.field_name}" conflicts with an existing verified claim.`,
    });
  }

  return created as DataClaim;
}

export async function setClaimReviewStatus(
  supabase: SupabaseClient,
  claimId: string,
  status: DataClaim["review_status"],
  reviewerNotes?: string
): Promise<void> {
  const { error } = await supabase
    .from("data_claims")
    .update({
      review_status: status,
      reviewer_notes: reviewerNotes ?? null,
      verified_at: status === "verified" ? new Date().toISOString() : null,
    })
    .eq("id", claimId);
  if (error) throw error;
}

/** Marks the older claim as superseded by the newer one, resolving a conflict. */
export async function supersedeClaim(
  supabase: SupabaseClient,
  oldClaimId: string,
  newClaimId: string
): Promise<void> {
  const { error } = await supabase.from("data_claims").update({ superseded_by: newClaimId }).eq("id", oldClaimId);
  if (error) throw error;
}

export async function listReviewQueue(
  supabase: SupabaseClient,
  status: AdminReviewQueueItem["status"] = "open"
): Promise<AdminReviewQueueItem[]> {
  const { data, error } = await supabase
    .from("admin_review_queue")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AdminReviewQueueItem[];
}

export async function resolveReviewQueueItem(
  supabase: SupabaseClient,
  id: string,
  status: AdminReviewQueueItem["status"],
  notes?: string
): Promise<void> {
  const { error } = await supabase.from("admin_review_queue").update({ status, notes }).eq("id", id);
  if (error) throw error;
}
