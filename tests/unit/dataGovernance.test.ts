import { describe, expect, it } from "vitest";
import { isExpired, isFresh } from "@/lib/utils/freshness";
import { claimsConflict } from "@/lib/utils/dataGovernance";

describe("T003 — an expired claim is never treated as current", () => {
  it("isFresh is false once expires_at has passed", () => {
    const past = new Date(Date.now() - 1000 * 60).toISOString();
    expect(isFresh(past)).toBe(false);
    expect(isExpired(past)).toBe(true);
  });

  it("isFresh is true while expires_at is still in the future", () => {
    const future = new Date(Date.now() + 1000 * 60 * 60).toISOString();
    expect(isFresh(future)).toBe(true);
    expect(isExpired(future)).toBe(false);
  });

  it("a null expires_at (no TTL) is treated as fresh, never as expired", () => {
    expect(isFresh(null)).toBe(true);
    expect(isExpired(null)).toBe(false);
  });
});

describe("T004 — contradictory claims are flagged as a conflict, not silently overwritten", () => {
  it("detects a conflict when values differ", () => {
    expect(claimsConflict("Advanced Open Water", "Open Water")).toBe(true);
    expect(claimsConflict({ amount: 100 }, { amount: 150 })).toBe(true);
  });

  it("does not flag identical values as a conflict", () => {
    expect(claimsConflict("Advanced Open Water", "Advanced Open Water")).toBe(false);
    expect(claimsConflict({ amount: 100 }, { amount: 100 })).toBe(false);
  });
});
