import type { SupabaseClient } from "@supabase/supabase-js";
import type { Mask } from "@/lib/types/domain";

export async function listMasks(supabase: SupabaseClient): Promise<Mask[]> {
  const { data, error } = await supabase.from("masks").select("*").eq("status", "published").order("brand");
  if (error) throw error;
  return (data ?? []) as Mask[];
}
