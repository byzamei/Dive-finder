// Real, current exchange rates — never a hardcoded/guessed conversion
// factor, which would drift out of date silently. Used only as an internal
// decision signal for the budget preference filter (see
// scoring/preferenceFilters.ts): does a price in another currency clear the
// searcher's stated budget. Never shown to the user as a converted price —
// displayed prices always stay in their real, original currency.
//
// Two independent free, keyless providers, merged together — using only
// one left real currencies in our data uncovered (Frankfurter's ~30-currency
// ECB reference list has no Fijian dollar, for instance) even though the
// provider itself was reachable and returned a perfectly good response for
// everything it does track. Merging maximizes real coverage instead of
// treating "provider responded" as "provider covers every currency we
// need":
//   1. Frankfurter (https://www.frankfurter.app) — European Central Bank
//      reference rates, updated on ECB business days. Takes precedence
//      where both providers cover the same currency.
//   2. open.er-api.com — updated daily, much broader currency list; fills
//      in whatever Frankfurter doesn't track.
// A currency in neither provider's list is still never guessed — callers
// must treat it as "no rate available", not as parity.
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
  const [frankfurter, openErApi] = await Promise.allSettled([fetchFrankfurter(), fetchOpenErApi()]);

  const merged: Record<string, number> = {};
  const errors: string[] = [];

  // open.er-api.com first (broader coverage), then Frankfurter over the
  // top — so where both track a currency, the ECB-backed figure wins.
  if (openErApi.status === "fulfilled") Object.assign(merged, openErApi.value);
  else errors.push(openErApi.reason instanceof Error ? openErApi.reason.message : String(openErApi.reason));

  if (frankfurter.status === "fulfilled") Object.assign(merged, frankfurter.value);
  else errors.push(frankfurter.reason instanceof Error ? frankfurter.reason.message : String(frankfurter.reason));

  if (Object.keys(merged).length === 0) return { rates: null, error: errors.join("; ") };
  return { rates: { base: "EUR", rates: merged }, error: errors.length > 0 ? errors.join("; ") : undefined };
}

/** Converts an amount in `fromCurrency` to its EUR equivalent, or null when we have no rate for it. */
export function toEur(amount: number, fromCurrency: string, rates: ExchangeRates): number | null {
  if (fromCurrency === "EUR") return amount;
  const rate = rates.rates[fromCurrency];
  if (!rate) return null;
  return amount / rate;
}
