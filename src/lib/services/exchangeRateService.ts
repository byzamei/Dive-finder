// Real, current exchange rates — never a hardcoded/guessed conversion
// factor, which would drift out of date silently. Used only as an internal
// decision signal for the budget preference filter (see
// scoring/preferenceFilters.ts): does a price in another currency clear the
// searcher's stated budget. Never shown to the user as a converted price —
// displayed prices always stay in their real, original currency.
//
// Source: Frankfurter (https://www.frankfurter.app), built on European
// Central Bank reference rates, free, no API key, updated on ECB business
// days. Covers most major currencies but not every one in our data (e.g.
// the Fijian dollar isn't an ECB reference currency) — callers must treat a
// missing currency as "no rate available", not as parity.
const FRANKFURTER_URL = "https://api.frankfurter.app/latest?from=EUR";

export interface ExchangeRates {
  /** EUR-based: units of that currency per 1 EUR. */
  base: "EUR";
  rates: Record<string, number>;
}

export async function fetchExchangeRates(): Promise<ExchangeRates | null> {
  try {
    const res = await fetch(FRANKFURTER_URL, { next: { revalidate: 60 * 60 * 12 } });
    if (!res.ok) return null;
    const data = (await res.json()) as { base?: string; rates?: Record<string, number> };
    if (!data.rates || typeof data.rates !== "object") return null;
    return { base: "EUR", rates: data.rates };
  } catch {
    return null;
  }
}

/** Converts an amount in `fromCurrency` to its EUR equivalent, or null when we have no rate for it. */
export function toEur(amount: number, fromCurrency: string, rates: ExchangeRates): number | null {
  if (fromCurrency === "EUR") return amount;
  const rate = rates.rates[fromCurrency];
  if (!rate) return null;
  return amount / rate;
}
