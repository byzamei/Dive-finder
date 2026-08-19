import type { SupabaseClient } from "@supabase/supabase-js";
import type { SearchCriteria } from "@/lib/types/domain";
import { buildScoringFacts, listCandidateDestinations } from "./searchService";
import { scoreAllDestinations, type ScoreAllResult } from "@/lib/scoring/scoringService";

/**
 * Top-level entry point for "run a search". Orchestrates candidate
 * fetching, fact-building and scoring, and (best-effort) logs the search
 * for analytics. Never throws on logging failure — a broken analytics
 * write must not break a user's search.
 *
 * Contract: works with zero criteria (returns everything, low completeness
 * warning likely true) so anonymous/blank searches never error (T007).
 */
export async function searchDestinations(
  supabase: SupabaseClient,
  criteria: SearchCriteria,
  opts: { userId?: string | null; sessionId?: string; includeDemo?: boolean } = {}
): Promise<ScoreAllResult> {
  const destinations = await listCandidateDestinations(supabase, { includeDemo: opts.includeDemo });
  const factsById = await buildScoringFacts(supabase, destinations);

  const entries = destinations
    .map((destination) => {
      const facts = factsById.get(destination.id);
      return facts ? { destination, facts } : null;
    })
    .filter((e): e is { destination: (typeof destinations)[number]; facts: NonNullable<typeof e>["facts"] } => Boolean(e));

  const result = scoreAllDestinations(entries, criteria);

  try {
    await supabase.from("searches").insert({
      user_id: opts.userId ?? null,
      session_id: opts.sessionId ?? null,
      criteria_json: criteria as unknown as Record<string, unknown>,
      results_count: result.ranked.length,
    });
  } catch {
    // Search logging is best-effort only.
  }

  return result;
}
