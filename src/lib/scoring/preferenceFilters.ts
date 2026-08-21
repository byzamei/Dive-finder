import type { SearchCriteria } from "@/lib/types/domain";
import type { DestinationScoringFacts } from "./types";
import { toEur, type ExchangeRates } from "@/lib/services/exchangeRateService";

export interface PreferenceFilterResult {
  excluded: boolean;
  reasons: string[];
}

/**
 * Unlike applyHardFilters() (safety-only — see hardFilters.ts), these
 * filters enforce what the searcher actually asked for: a destination is
 * excluded once we have DATA proving it fails a criterion the searcher set.
 *
 * A destination we have NO data for on a given criterion is never excluded
 * by it — only ever by an affirmative fact. Excluding for missing data
 * would punish destinations that simply haven't been documented yet for
 * that one field, which is the opposite of what this project's
 * "unknown is not the same as bad" data-governance rule is for (see
 * docs/data-governance.md). Every exclusion here is because we know
 * something the searcher's own criteria rule out, never because we don't.
 */
export function applyPreferenceFilters(
  facts: DestinationScoringFacts,
  criteria: SearchCriteria,
  exchangeRates?: ExchangeRates | null
): PreferenceFilterResult {
  const reasons: string[] = [];

  // Budget: same-currency prices compare directly. Cross-currency prices
  // only compare when we have a real, current rate (exchangeRateService.ts
  // — never a hardcoded/guessed factor); with no rate available for that
  // currency, we say nothing rather than fabricate a comparison.
  if (criteria.budgetTotal != null && facts.indicativeBudget?.amountMin != null) {
    const { amountMin, currency } = facts.indicativeBudget;
    const budgetCurrency = criteria.currency ?? "EUR";
    const budgetTotal = criteria.budgetTotal;
    let isOverBudget = false;
    if (currency === budgetCurrency) {
      isOverBudget = amountMin > budgetTotal;
    } else if (exchangeRates) {
      const priceInEur = toEur(amountMin, currency, exchangeRates);
      const budgetInEur = toEur(budgetTotal, budgetCurrency, exchangeRates);
      isOverBudget = priceInEur != null && budgetInEur != null && priceInEur > budgetInEur;
    }
    if (isOverBudget) reasons.push("Cheapest known price is above the stated budget");
  }

  // Dive type: only judged once the destination has any tags at all — an
  // untagged destination isn't "wrong type", it's undocumented.
  if (criteria.diveTypes && criteria.diveTypes.length > 0 && facts.diveTypeTags.length > 0) {
    const overlaps = facts.diveTypeTags.some((t) => criteria.diveTypes!.includes(t));
    if (!overlaps) reasons.push("None of its known dive types match what was requested");
  }

  // Conditions: only judged once typical current is known.
  if (criteria.acceptedCurrent && criteria.acceptedCurrent.length > 0 && facts.typicalCurrent) {
    if (!criteria.acceptedCurrent.includes(facts.typicalCurrent)) {
      reasons.push("Typical current is outside the accepted range");
    }
  }

  // Wildlife: OR across the selection — a searcher who checks several
  // species is asking "does it have any of these", not demanding every one
  // at once. Excluded only when we have zero evidence (no presence link and
  // no seasonality data) for every single species they picked.
  if (criteria.speciesIds && criteria.speciesIds.length > 0) {
    const hasEvidenceForAny = criteria.speciesIds.some(
      (id) => facts.speciesPresent.includes(id) || Boolean(facts.monthlySpeciesSuitability[id])
    );
    if (!hasEvidenceForAny) reasons.push("No verified record of any selected species here");
  }

  return { excluded: reasons.length > 0, reasons };
}
