import { NextResponse } from "next/server";
import { fetchExchangeRates } from "@/lib/services/exchangeRateService";

// Thin proxy so the client-side search (searchService.ts) can get current
// exchange rates through Next.js's server-side fetch cache (12h, see
// exchangeRateService.ts) instead of hitting Frankfurter directly on every
// search.
export async function GET() {
  const rates = await fetchExchangeRates();
  return NextResponse.json({ rates });
}
