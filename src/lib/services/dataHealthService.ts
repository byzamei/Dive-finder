import type { SupabaseClient } from "@supabase/supabase-js";

/** Shape of `v_data_health_summary` (supabase/migrations/0009_data_health.sql). */
export interface DataHealthSummary {
  critical_fields_sourced_pct: number;
  fresh_claims_pct: number;
  destinations_ready_count: number;
  dive_sites_ready_count: number;
  species_ready_count: number;
  disputed_claims_count: number;
  expired_price_claims_count: number;
  published_destinations_count: number;
  active_sources_count: number;
  open_review_queue_count: number;
}

export async function getDataHealthSummary(supabase: SupabaseClient): Promise<DataHealthSummary> {
  const { data, error } = await supabase.from("v_data_health_summary").select("*").single();
  if (error) throw error;
  return data as DataHealthSummary;
}

export interface CoverageRow {
  destination_id?: string;
  site_id?: string;
  name: string;
  critical_fields_total: number;
  critical_fields_sourced: number;
}

export async function getDestinationCoverage(supabase: SupabaseClient): Promise<CoverageRow[]> {
  const { data, error } = await supabase
    .from("v_destination_critical_field_coverage")
    .select("*")
    .order("critical_fields_sourced", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CoverageRow[];
}

export async function getDiveSiteCoverage(supabase: SupabaseClient): Promise<CoverageRow[]> {
  const { data, error } = await supabase
    .from("v_dive_site_critical_field_coverage")
    .select("*")
    .order("critical_fields_sourced", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CoverageRow[];
}
