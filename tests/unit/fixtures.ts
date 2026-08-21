import type { Destination } from "@/lib/types/domain";
import type { DestinationScoringFacts } from "@/lib/scoring/types";

export function makeDestination(overrides: Partial<Destination> = {}): Destination {
  return {
    id: "dest-1",
    slug: "test-destination",
    name: "Test Destination",
    country_id: null,
    region_id: null,
    latitude: null,
    longitude: null,
    summary: null,
    hero_image_url: null,
    dive_type_tags: [],
    demo_data: false,
    status: "published",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeFacts(overrides: Partial<DestinationScoringFacts> = {}): DestinationScoringFacts {
  return {
    destinationId: "dest-1",
    demoData: false,
    monthlyEnvironment: {},
    monthlySpeciesSuitability: {},
    speciesPresent: [],
    indicativeBudget: null,
    typicalCurrent: null,
    typicalCurrentConfidence: null,
    safetyRequirement: null,
    isCaveSite: false,
    diveTypeTags: [],
    reviewsAvgRating: null,
    reviewsCount: 0,
    dataConfidence: "medium",
    lastUpdated: null,
    ...overrides,
  };
}
