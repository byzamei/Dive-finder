import type { SupabaseClient } from "@supabase/supabase-js";
import type { DiveLogEntry, GasType } from "@/lib/types/domain";
import { markSpeciesSeenFromDive } from "@/lib/services/speciesSeenService";

export async function listDiveLogEntries(supabase: SupabaseClient, userId: string): Promise<DiveLogEntry[]> {
  const { data, error } = await supabase
    .from("dive_log_entries")
    .select("*")
    .eq("user_id", userId)
    .order("dive_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DiveLogEntry[];
}

export async function getDiveLogEntry(supabase: SupabaseClient, id: string): Promise<DiveLogEntry | null> {
  const { data, error } = await supabase.from("dive_log_entries").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as DiveLogEntry | null;
}

export interface DiveLogEntryInput {
  diveDate: string;
  siteId: string | null;
  siteName: string | null;
  destinationId: string | null;
  durationMinutes: number | null;
  maxDepthM: number | null;
  avgDepthM: number | null;
  waterTempC: number | null;
  visibilityBucket: string | null;
  currentBucket: string | null;
  buddyName: string | null;
  gasType: GasType | null;
  nitroxPercentage: number | null;
  speciesObserved: string[];
  rating: number | null;
  notes: string | null;
}

function toRow(input: DiveLogEntryInput) {
  return {
    dive_date: input.diveDate,
    site_id: input.siteId,
    site_name: input.siteName,
    destination_id: input.destinationId,
    duration_minutes: input.durationMinutes,
    max_depth_m: input.maxDepthM,
    avg_depth_m: input.avgDepthM,
    water_temp_c: input.waterTempC,
    visibility_bucket: input.visibilityBucket,
    current_bucket: input.currentBucket,
    buddy_name: input.buddyName,
    gas_type: input.gasType,
    nitrox_percentage: input.nitroxPercentage,
    species_observed: input.speciesObserved,
    rating: input.rating,
    notes: input.notes,
  };
}

/** Inserts the entry, then marks every observed species as "seen" on the diver's life list — the logbook and the life list are the same data, not two things kept in sync by hand. */
export async function createDiveLogEntry(supabase: SupabaseClient, userId: string, input: DiveLogEntryInput): Promise<void> {
  const { error } = await supabase.from("dive_log_entries").insert({ ...toRow(input), user_id: userId });
  if (error) throw error;
  await markSpeciesSeenFromDive(supabase, userId, input.speciesObserved, input.diveDate);
}

/** Updates the entry, then marks any newly-added observed species as "seen" too — editing an old entry to add a species should still land it on the life list. */
export async function updateDiveLogEntry(supabase: SupabaseClient, userId: string, id: string, input: DiveLogEntryInput): Promise<void> {
  const { error } = await supabase.from("dive_log_entries").update(toRow(input)).eq("id", id);
  if (error) throw error;
  await markSpeciesSeenFromDive(supabase, userId, input.speciesObserved, input.diveDate);
}

export async function deleteDiveLogEntry(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("dive_log_entries").delete().eq("id", id);
  if (error) throw error;
}

export interface DiveLogStats {
  totalDives: number;
  totalBottomTimeMinutes: number;
  deepestDiveM: number | null;
}

export function computeDiveLogStats(entries: DiveLogEntry[]): DiveLogStats {
  return {
    totalDives: entries.length,
    totalBottomTimeMinutes: entries.reduce((sum, e) => sum + (e.duration_minutes ?? 0), 0),
    deepestDiveM: entries.reduce<number | null>((max, e) => {
      if (e.max_depth_m == null) return max;
      return max == null ? e.max_depth_m : Math.max(max, e.max_depth_m);
    }, null),
  };
}
