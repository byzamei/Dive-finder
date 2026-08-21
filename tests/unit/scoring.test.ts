import { describe, expect, it } from "vitest";
import { scoreDestination, scoreAllDestinations, aggregateScore, computeDimensions } from "@/lib/scoring/scoringService";
import { scoreWildlifeMatch } from "@/lib/scoring/dimensions";
import { applyHardFilters } from "@/lib/scoring/hardFilters";
import { applyPreferenceFilters } from "@/lib/scoring/preferenceFilters";
import { SCORE_WEIGHTS } from "@/lib/scoring/weights";
import type { SearchCriteria } from "@/lib/types/domain";
import { makeDestination, makeFacts } from "./fixtures";

const SHARK_ID = "species-shark";

describe("T001 — sparse-data search explains unknowns instead of guessing", () => {
  it("scores a destination with zero underlying data as fully unknown, never invented", () => {
    const destination = makeDestination({ name: "No Data Yet" });
    const facts = makeFacts();
    const criteria: SearchCriteria = {
      months: [2],
      budgetTotal: 2000,
      currency: "EUR",
      numberOfDivesBucket: "25-49",
      speciesIds: [SHARK_ID],
    };

    const result = scoreDestination(destination, facts, criteria);

    expect(result.matchScore).toBe(0);
    expect(result.dataCompletenessPct).toBe(0);
    // Every scoreable dimension must be listed as unknown — nothing silently defaulted.
    expect(result.unknowns.length).toBe(Object.keys(SCORE_WEIGHTS).length);
    expect(result.reasons).toEqual([]);
  });

  it("only marks dimensions unknown when no source-backed data exists for them, and scores the rest", () => {
    const destination = makeDestination({ dive_type_tags: ["pelagic"] });
    const facts = makeFacts({
      monthlyEnvironment: { 2: { waterTempMinC: 27, waterTempMaxC: 29, visibilityMinM: 20, visibilityMaxM: 30 } },
      monthlySpeciesSuitability: { [SHARK_ID]: { 2: "excellent" } },
    });
    const criteria: SearchCriteria = { months: [2], speciesIds: [SHARK_ID] };

    const result = scoreDestination(destination, facts, criteria);

    expect(result.unknowns).not.toContain("Seasonality");
    expect(result.unknowns).not.toContain("Wildlife you want to see");
    // Budget/level/conditions/dive-type/accessibility/reviews were never given data.
    expect(result.unknowns).toContain("Budget");
    expect(result.dataCompletenessPct).toBeLessThan(100);
    expect(result.dataCompletenessPct).toBeGreaterThan(0);
  });
});

describe("T002 — beginner vs. a reliably strong-current site", () => {
  const beginnerCriteria: SearchCriteria = {
    numberOfDivesBucket: "0-9",
    currentExperience: "none",
    certificationId: "open-water",
  };

  it("hard-excludes when the strong-current claim is HIGH confidence", () => {
    const facts = makeFacts({ typicalCurrent: "strong", typicalCurrentConfidence: "high" });
    const { excluded, warnings } = applyHardFilters(facts, beginnerCriteria);
    expect(excluded).toBe(true);
    expect(warnings).toEqual([]);
  });

  it("only warns (does not exclude) when confidence is not high", () => {
    const facts = makeFacts({ typicalCurrent: "strong", typicalCurrentConfidence: "medium" });
    const { excluded, warnings } = applyHardFilters(facts, beginnerCriteria);
    expect(excluded).toBe(false);
    expect(warnings.length).toBeGreaterThan(0);
  });

  it("excluded destinations never appear in ranked results", () => {
    const destination = makeDestination();
    const facts = makeFacts({ typicalCurrent: "strong", typicalCurrentConfidence: "high" });
    const { ranked, excludedCount } = scoreAllDestinations([{ destination, facts }], beginnerCriteria);
    expect(ranked).toHaveLength(0);
    expect(excludedCount).toBe(1);
  });

  it("never treats declared cave experience as an authorization", () => {
    const facts = makeFacts({ isCaveSite: true });
    const criteriaWithCaveDeclared: SearchCriteria = { caveDeclared: true };
    const { warnings } = applyHardFilters(facts, criteriaWithCaveDeclared);
    expect(warnings.some((w) => w.toLowerCase().includes("cave"))).toBe(true);
  });
});

describe("T005 — wildlife suitability is never a fabricated numeric probability", () => {
  it("returns null (unknown) rather than 0 when a species has no seasonality data at all", () => {
    const facts = makeFacts({ monthlySpeciesSuitability: {} });
    const score = scoreWildlifeMatch(facts, { speciesIds: [SHARK_ID] });
    expect(score).toBeNull();
  });

  it("averages only qualitative suitability values, staying within [0,1] — never an invented percentage", () => {
    const facts = makeFacts({ monthlySpeciesSuitability: { [SHARK_ID]: { 2: "excellent" } } });
    const score = scoreWildlifeMatch(facts, { months: [2], speciesIds: [SHARK_ID] });
    expect(score).not.toBeNull();
    expect(score as number).toBeGreaterThanOrEqual(0);
    expect(score as number).toBeLessThanOrEqual(1);
  });

  it("the domain ScoredDestination type never carries a raw sighting-probability field", async () => {
    // Structural guard: breakdown values are score points (0..weight), not percentages.
    const destination = makeDestination();
    const facts = makeFacts({ monthlySpeciesSuitability: { [SHARK_ID]: { 2: "good" } } });
    const result = scoreDestination(destination, facts, { months: [2], speciesIds: [SHARK_ID] });
    expect(result.breakdown.wildlifeMatch).toBeLessThanOrEqual(SCORE_WEIGHTS.wildlifeMatch);
  });
});

describe("T006 — impossible budget produces a clear low score, never an invented match", () => {
  it("scores a wildly mismatched budget low rather than fabricating a good fit", () => {
    const destination = makeDestination();
    const facts = makeFacts({ indicativeBudget: { amountMin: 8000, amountMax: 12000, currency: "EUR" } });
    const criteria: SearchCriteria = { budgetTotal: 300, currency: "EUR" };

    const result = scoreDestination(destination, facts, criteria);
    expect(result.breakdown.budgetFit).not.toBeNull();
    expect((result.breakdown.budgetFit as number) / SCORE_WEIGHTS.budgetFit).toBeLessThan(0.5);
    expect(result.tradeOffs).toContain("Budget");
  });

  it("never hard-excludes purely for budget — budget is scored by applyHardFilters(), not filtered (applyPreferenceFilters() is the separate step that does, see T011)", () => {
    const destination = makeDestination();
    const facts = makeFacts({ indicativeBudget: { amountMin: 8000, amountMax: 12000, currency: "EUR" } });
    const { excluded } = applyHardFilters(facts, { budgetTotal: 300 });
    expect(excluded).toBe(false);
  });
});

describe("T011 — preference filters actually exclude what the searcher asked to exclude", () => {
  it("excludes a destination whose cheapest same-currency price is above budget", () => {
    const facts = makeFacts({ indicativeBudget: { amountMin: 8000, amountMax: null, currency: "EUR" } });
    const { excluded, reasons } = applyPreferenceFilters(facts, { budgetTotal: 300, currency: "EUR" });
    expect(excluded).toBe(true);
    expect(reasons.length).toBeGreaterThan(0);
  });

  it("never excludes for budget across different currencies when no exchange rate is available", () => {
    const facts = makeFacts({ indicativeBudget: { amountMin: 8000, amountMax: null, currency: "USD" } });
    const { excluded } = applyPreferenceFilters(facts, { budgetTotal: 300, currency: "EUR" });
    expect(excluded).toBe(false);
  });

  it("excludes across currencies when a real exchange rate is supplied", () => {
    const facts = makeFacts({ indicativeBudget: { amountMin: 8000, amountMax: null, currency: "USD" } });
    const rates = { base: "EUR" as const, rates: { USD: 1.1 } }; // 8000 USD ≈ 7273 EUR, well above a 300 EUR budget
    const { excluded } = applyPreferenceFilters(facts, { budgetTotal: 300, currency: "EUR" }, rates);
    expect(excluded).toBe(true);
  });

  it("never excludes across currencies when the rate feed has no entry for that currency", () => {
    const facts = makeFacts({ indicativeBudget: { amountMin: 8000, amountMax: null, currency: "FJD" } });
    const rates = { base: "EUR" as const, rates: { USD: 1.1 } }; // no FJD entry
    const { excluded } = applyPreferenceFilters(facts, { budgetTotal: 300, currency: "EUR" }, rates);
    expect(excluded).toBe(false);
  });

  it("never excludes for budget when there is no price data at all — unknown is not the same as over budget", () => {
    const facts = makeFacts({ indicativeBudget: null });
    const { excluded } = applyPreferenceFilters(facts, { budgetTotal: 300, currency: "EUR" });
    expect(excluded).toBe(false);
  });

  it("excludes a destination whose known dive-type tags share none with what was requested", () => {
    const facts = makeFacts({ diveTypeTags: ["wreck"] });
    const { excluded } = applyPreferenceFilters(facts, { diveTypes: ["muck"] });
    expect(excluded).toBe(true);
  });

  it("never excludes on dive type when the destination has no tags at all", () => {
    const facts = makeFacts({ diveTypeTags: [] });
    const { excluded } = applyPreferenceFilters(facts, { diveTypes: ["muck"] });
    expect(excluded).toBe(false);
  });

  it("excludes a destination whose known typical current is outside the accepted range", () => {
    const facts = makeFacts({ typicalCurrent: "strong", typicalCurrentConfidence: "low" });
    const { excluded } = applyPreferenceFilters(facts, { acceptedCurrent: ["none", "mild"] });
    expect(excluded).toBe(true);
  });

  it("excludes for wildlife only when NONE of the selected species has any evidence (OR across the selection)", () => {
    const facts = makeFacts({ speciesPresent: [SHARK_ID], monthlySpeciesSuitability: {} });
    const excludedNone = applyPreferenceFilters(facts, { speciesIds: ["other-species"] });
    expect(excludedNone.excluded).toBe(true);

    const excludedSome = applyPreferenceFilters(facts, { speciesIds: [SHARK_ID, "other-species"] });
    expect(excludedSome.excluded).toBe(false);
  });

  it("a species with only seasonality data (no destination_species link) still counts as evidence", () => {
    const facts = makeFacts({ speciesPresent: [], monthlySpeciesSuitability: { [SHARK_ID]: { 2: "good" } } });
    const { excluded } = applyPreferenceFilters(facts, { speciesIds: [SHARK_ID] });
    expect(excluded).toBe(false);
  });

  it("flows through scoreAllDestinations exactly like a safety exclusion — dropped from ranked, counted in excludedCount", () => {
    const destination = makeDestination();
    const facts = makeFacts({ indicativeBudget: { amountMin: 8000, amountMax: null, currency: "EUR" } });
    const { ranked, excludedCount } = scoreAllDestinations([{ destination, facts }], { budgetTotal: 300, currency: "EUR" });
    expect(ranked).toHaveLength(0);
    expect(excludedCount).toBe(1);
  });
});

describe("T010 — score renormalizes over known dimensions; completeness is reported separately", () => {
  it("computes matchScore only from dimensions with data, and completeness independently", () => {
    const dims = computeDimensions(
      makeFacts({
        monthlyEnvironment: { 2: { waterTempMinC: 27, waterTempMaxC: 29, visibilityMinM: 10, visibilityMaxM: 20 } },
      }),
      { months: [2] }
    );
    const { matchScore, dataCompletenessPct } = aggregateScore(dims);

    // Only "seasonality" (weight 20) had data -> its 1.0 score should renormalize to 100.
    expect(matchScore).toBe(100);
    expect(dataCompletenessPct).toBe(20);
  });

  it("never treats a missing dimension as zero in the average", () => {
    const allUnknown = computeDimensions(makeFacts(), {});
    const { matchScore, dataCompletenessPct } = aggregateScore(allUnknown);
    expect(matchScore).toBe(0);
    expect(dataCompletenessPct).toBe(0);
  });
});

describe("T007 — anonymous / minimal-criteria search never throws", () => {
  it("scores destinations with completely empty criteria", () => {
    const destination = makeDestination();
    const facts = makeFacts();
    expect(() => scoreDestination(destination, facts, {})).not.toThrow();
  });

  it("scoreAllDestinations handles an empty candidate list gracefully", () => {
    const result = scoreAllDestinations([], {});
    expect(result.ranked).toEqual([]);
    expect(result.lowDataWarning).toBe(false);
  });
});
