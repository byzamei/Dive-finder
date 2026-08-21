"use client";

import type { ExchangeRates } from "@/lib/services/exchangeRateService";

// Client-side helper for searchService.ts, which currently only ever runs
// in the browser (see recommendationService.ts) — goes through /api/fx
// rather than calling exchangeRateService directly so the fetch benefits
// from Next.js's server-side cache instead of hitting Frankfurter on every
// search. Graceful null on any failure — callers must fall back to
// same-currency-only comparisons, never block a search on this.
export async function fetchExchangeRatesClient(): Promise<ExchangeRates | null> {
  try {
    const res = await fetch("/api/fx");
    if (!res.ok) return null;
    const { rates } = (await res.json()) as { rates: ExchangeRates | null };
    return rates;
  } catch {
    return null;
  }
}
