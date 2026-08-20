import { describe, expect, it } from "vitest";
import { bucketReservation } from "@/lib/services/reservationService";
import type { Reservation } from "@/lib/types/domain";

const base: Reservation = {
  id: "r1",
  user_id: "u1",
  destination_id: null,
  destination_name: "Bonaire",
  operator_type: null,
  operator_id: null,
  operator_name: null,
  start_date: "2026-09-01",
  end_date: null,
  status: "confirmed",
  notes: null,
  created_at: "2026-08-01T00:00:00Z",
  updated_at: "2026-08-01T00:00:00Z",
};

const today = new Date("2026-08-20T12:00:00Z");

describe("bucketReservation", () => {
  it("buckets a future start date as upcoming", () => {
    expect(bucketReservation({ ...base, start_date: "2026-09-01" }, today)).toBe("upcoming");
  });

  it("buckets a past end date as past", () => {
    expect(bucketReservation({ ...base, start_date: "2026-07-01", end_date: "2026-07-10" }, today)).toBe("past");
  });

  it("uses start_date as the fallback when end_date is missing", () => {
    expect(bucketReservation({ ...base, start_date: "2026-07-01", end_date: null }, today)).toBe("past");
  });

  it("treats today as upcoming (trip hasn't finished yet)", () => {
    expect(bucketReservation({ ...base, start_date: "2026-08-15", end_date: "2026-08-20" }, today)).toBe("upcoming");
  });

  it("cancelled always wins regardless of dates", () => {
    expect(bucketReservation({ ...base, start_date: "2026-09-01", status: "cancelled" }, today)).toBe("cancelled");
    expect(bucketReservation({ ...base, start_date: "2026-01-01", status: "cancelled" }, today)).toBe("cancelled");
  });
});
