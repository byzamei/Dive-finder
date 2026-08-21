import type { SupabaseClient } from "@supabase/supabase-js";
import type { Confidence, CurrentLevel, Destination, Suitability, UUID } from "@/lib/types/domain";
import type { DestinationScoringFacts, MinExperienceRequirement } from "@/lib/scoring/types";
import { getCheapestPricePerDestination } from "./operatorService";

/**
 * Data-access layer that turns raw Supabase rows into the normalized
 * `DestinationScoringFacts` the scoring engine consumes. This is the ONLY
 * place that should read data_claims / species_seasonality /
 * environmental_seasonality / prices for scoring purposes — keeping the
 * join logic in one spot makes it easy to audit for "did we ever guess a
 * value instead of reading a verified claim".
 */

const CONFIDENCE_RANK: Record<Confidence, number> = { low: 0, medium: 1, high: 2 };

function rollupConfidence(values: Confidence[]): Confidence {
  if (values.length === 0) return "low";
  return values.reduce((worst, v) => (CONFIDENCE_RANK[v] < CONFIDENCE_RANK[worst] ? v : worst));
}

export async function listCandidateDestinations(
  supabase: SupabaseClient,
  opts: { includeDemo?: boolean } = {}
): Promise<Destination[]> {
  let query = supabase.from("destinations").select("*").eq("status", "published");
  if (!opts.includeDemo) query = query.eq("demo_data", false);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Destination[];
}

export async function buildScoringFacts(
  supabase: SupabaseClient,
  destinations: Destination[]
): Promise<Map<UUID, DestinationScoringFacts>> {
  const ids = destinations.map((d) => d.id);
  if (ids.length === 0) return new Map();

  const nowIso = new Date().toISOString();
  const [envRes, seasonRes, presenceRes, priceRes, claimRes, reviewRes, cheapestOperatorPrices] = await Promise.all([
    supabase.from("environmental_seasonality").select("*").in("destination_id", ids),
    supabase.from("species_seasonality").select("*").in("destination_id", ids),
    supabase.from("destination_species").select("destination_id, species_id").in("destination_id", ids),
    supabase
      .from("prices")
      .select("*")
      .eq("entity_type", "destination")
      .in("entity_id", ids)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`),
    supabase.from("data_claims").select("*").eq("entity_type", "destination").in("entity_id", ids).is("superseded_by", null),
    supabase.from("reviews").select("entity_id, rating").eq("entity_type", "destination").eq("status", "published").in("entity_id", ids),
    // Destination-level `prices` rows (entity_type='destination') are rare —
    // almost all real price data lives on operators (dive_centers /
    // liveaboards). Without this fallback, budgetFit and the new budget
    // preference filter would see `indicativeBudget: null` for nearly every
    // real destination and never do anything, regardless of what the
    // searcher typed.
    getCheapestPricePerDestination(supabase, ids),
  ]);

  for (const res of [envRes, seasonRes, presenceRes, priceRes, claimRes, reviewRes]) {
    if (res.error) throw res.error;
  }

  const facts = new Map<UUID, DestinationScoringFacts>();

  for (const destination of destinations) {
    const envRows = (envRes.data ?? []).filter((r) => r.destination_id === destination.id);
    const seasonRows = (seasonRes.data ?? []).filter((r) => r.destination_id === destination.id);
    const presenceRows = (presenceRes.data ?? []).filter((r) => r.destination_id === destination.id);
    const priceRows = (priceRes.data ?? []).filter((r) => r.entity_id === destination.id);
    const claimRows = (claimRes.data ?? []).filter((r) => r.entity_id === destination.id);
    const reviewRows = (reviewRes.data ?? []).filter((r) => r.entity_id === destination.id);

    const monthlyEnvironment: DestinationScoringFacts["monthlyEnvironment"] = {};
    for (const row of envRows) {
      monthlyEnvironment[row.month] = {
        waterTempMinC: row.water_temp_c_min,
        waterTempMaxC: row.water_temp_c_max,
        visibilityMinM: row.visibility_m_min,
        visibilityMaxM: row.visibility_m_max,
      };
    }

    const monthlySpeciesSuitability: DestinationScoringFacts["monthlySpeciesSuitability"] = {};
    for (const row of seasonRows) {
      const bySpecies = monthlySpeciesSuitability[row.species_id] ?? {};
      bySpecies[row.month] = row.suitability as Suitability;
      monthlySpeciesSuitability[row.species_id] = bySpecies;
    }

    const priceRow = priceRows.find((p) => p.price_type === "package") ?? priceRows[0];
    const cheapestOperatorPrice = cheapestOperatorPrices.get(destination.id);
    const indicativeBudget = priceRow
      ? { amountMin: priceRow.amount_min, amountMax: priceRow.amount_max, currency: priceRow.currency }
      : cheapestOperatorPrice
        ? { amountMin: cheapestOperatorPrice.amountMin, amountMax: null, currency: cheapestOperatorPrice.currency }
        : null;

    const currentClaim = claimRows.find((c) => c.field_name === "typical_current" && c.review_status === "verified");
    const levelClaim = claimRows.find((c) => c.field_name === "recommended_level" && c.review_status === "verified");

    const safetyRequirement = levelClaim
      ? {
          minExperience: normalizeMinExperience(String(levelClaim.value_json)),
          confidence: levelClaim.confidence as Confidence,
        }
      : null;

    const isCaveSite = claimRows.some(
      (c) => c.field_name === "site_type" && String(c.value_json).toLowerCase().includes("cave")
    );

    const usedConfidences = claimRows
      .filter((c) => c.review_status === "verified")
      .map((c) => c.confidence as Confidence);
    const lastUpdatedTimestamps = claimRows.map((c) => c.verified_at ?? c.updated_at).filter(Boolean) as string[];

    facts.set(destination.id, {
      destinationId: destination.id,
      demoData: destination.demo_data,
      monthlyEnvironment,
      monthlySpeciesSuitability,
      speciesPresent: presenceRows.map((r) => r.species_id),
      indicativeBudget,
      typicalCurrent: (currentClaim?.value_json as CurrentLevel) ?? null,
      typicalCurrentConfidence: currentClaim ? (currentClaim.confidence as Confidence) : null,
      safetyRequirement,
      isCaveSite,
      diveTypeTags: destination.dive_type_tags,
      reviewsAvgRating: reviewRows.length ? average(reviewRows.map((r) => r.rating ?? 0)) : null,
      reviewsCount: reviewRows.length,
      dataConfidence: rollupConfidence(usedConfidences),
      lastUpdated: lastUpdatedTimestamps.length ? lastUpdatedTimestamps.sort().at(-1)! : null,
    });
  }

  return facts;
}

function normalizeMinExperience(raw: string): MinExperienceRequirement {
  const value = raw.toLowerCase();
  if (value.includes("rescue")) return "rescue";
  if (value.includes("advanced")) return "advanced";
  if (value.includes("open water")) return "open_water";
  return "any";
}

function average(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}
