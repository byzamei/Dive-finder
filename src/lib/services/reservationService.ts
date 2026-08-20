import type { SupabaseClient } from "@supabase/supabase-js";
import type { OperatorType, Reservation } from "@/lib/types/domain";

export async function listReservations(supabase: SupabaseClient, userId: string): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("user_id", userId)
    .order("start_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Reservation[];
}

export interface ReservationInput {
  destinationId: string | null;
  destinationName: string | null;
  operatorType: OperatorType | null;
  operatorId: string | null;
  operatorName: string | null;
  startDate: string;
  endDate: string | null;
  notes: string | null;
}

function toRow(input: ReservationInput) {
  return {
    destination_id: input.destinationId,
    destination_name: input.destinationName,
    operator_type: input.operatorType,
    operator_id: input.operatorId,
    operator_name: input.operatorName,
    start_date: input.startDate,
    end_date: input.endDate,
    notes: input.notes,
  };
}

export async function createReservation(supabase: SupabaseClient, userId: string, input: ReservationInput): Promise<Reservation> {
  const { data, error } = await supabase
    .from("reservations")
    .insert({ ...toRow(input), user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data as Reservation;
}

export async function updateReservation(supabase: SupabaseClient, id: string, input: ReservationInput): Promise<void> {
  const { error } = await supabase.from("reservations").update(toRow(input)).eq("id", id);
  if (error) throw error;
}

export async function setReservationStatus(
  supabase: SupabaseClient,
  id: string,
  status: "confirmed" | "cancelled"
): Promise<void> {
  const { error } = await supabase.from("reservations").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteReservation(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("reservations").delete().eq("id", id);
  if (error) throw error;
}

export type ReservationBucket = "upcoming" | "past" | "cancelled";

/** A reservation is "past" once its last day (end_date, falling back to start_date) has passed — cancelled always wins regardless of dates. */
export function bucketReservation(reservation: Reservation, today: Date = new Date()): ReservationBucket {
  if (reservation.status === "cancelled") return "cancelled";
  const lastDay = new Date(reservation.end_date ?? reservation.start_date);
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return lastDay < todayMidnight ? "past" : "upcoming";
}
