// Real, current exchange rates — never a hardcoded/guessed conversion
// factor, which would drift out of date silently. Used only as an internal
// decision signal for the budget preference filter (see
// scoring/preferenceFilters.ts): does a price in another currency clear the
// searcher's stated budget. Never shown to the user as a converted price —
// displayed prices always stay in their real, original currency.
//
// Two independent free, keyless providers, tried in order — if the first
// is unreachable or changes shape, the second keeps this working rather
// than silently falling back to "never compare" for every search:
//   1. Frankfurter (https://www.frankfurter.app) — European Central Bank
//      reference rates, updated on ECB business days.
//   2. open.er-api.com — updated daily, broader currency coverage.
// Both cover most major currencies but not every one in our data (e.g. the
// Fijian dollar is in neither) — callers must treat a missing currency as
// "no rate available", not as parity.
const FRANKFURTER_URL = "https://api.frankfurter.app/latest?from=EUR";
const OPEN_ER_API_URL = "https://open.er-api.com/v6/latest/EUR";

export interface ExchangeRates {
  /** EUR-based: units of that currency per 1 EUR. */
  base: "EUR";
  rates: Record<string, number>;
}

async function fetchFrankfurter(): Promise<Record<string, number>> {
  const res = await fetch(FRANKFURTER_URL, { next: { revalidate: 60 * 60 * 12 } });
  if (!res.ok) throw new Error(`Frankfurter responded ${res.status}`);
  const data = (await res.json()) as { rates?: Record<string, number> };
  if (!data.rates || typeof data.rates !== "object") throw new Error("Frankfurter response had no rates");
  return data.rates;
}

async function fetchOpenErApi(): Promise<Record<string, number>> {
  const res = await fetch(OPEN_ER_API_URL, { next: { revalidate: 60 * 60 * 12 } });
  if (!res.ok) throw new Error(`open.er-api.com responded ${res.status}`);
  const data = (await res.json()) as { result?: string; rates?: Record<string, number> };
  if (data.result !== "success" || !data.rates) throw new Error("open.er-api.com response had no rates");
  return data.rates;
}

export interface FetchExchangeRatesResult {
  rates: ExchangeRates | null;
  /** Set only when both providers failed — surfaced by /api/fx for diagnosing a stuck currency filter without server-log access. */
  error?: string;
}

export async function fetchExchangeRates(): Promise<FetchExchangeRatesResult> {
  const errors: string[] = [];
  for (const fetcher of [fetchFrankfurter, fetchOpenErApi]) {
    try {
      const rates = await fetcher();
      return { rates: { base: "EUR", rates } };
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }
  return { rates: null, error: errors.join("; ") };
}

/** Converts an amount in `fromCurrency` to its EUR equivalent, or null when we have no rate for it. */
export function toEur(amount: number, fromCurrency: string, rates: ExchangeRates): number | null {
  if (fromCurrency === "EUR") return amount;
  const rate = rates.rates[fromCurrency];
  if (!rate) return null;
  return amount / rate;
}
