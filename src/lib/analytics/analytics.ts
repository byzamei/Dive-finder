// Analytics abstraction. Buffers/forwards named product events without ever
// including sensitive diver-profile detail (only coarse booleans/counts).
// No-ops when NEXT_PUBLIC_ANALYTICS_WRITE_KEY is unset, so local dev and
// tests never depend on an external analytics provider.
//
// Swap `dispatch()` for a real provider call (PostHog, Segment, Plausible,
// ...) — everything else in the app only ever calls `track()`.

export type AnalyticsEvent =
  | { name: "search_started"; properties?: { has_dates?: boolean; has_species?: boolean } }
  | { name: "search_completed"; properties: { resultCount: number; durationMs: number } }
  | { name: "results_returned"; properties: { resultCount: number; avgDataCompleteness: number } }
  | { name: "result_opened"; properties: { destinationSlug: string; position: number } }
  | { name: "favorite_added"; properties: { entityType: "destination" | "site" } }
  | { name: "compare_used"; properties: { count: number } }
  | { name: "species_filter_used"; properties: { speciesCount: number } }
  | { name: "no_results"; properties?: { reason?: string } }
  | { name: "signup_completed"; properties?: { method?: "magic_link" | "google" } };

const writeKey = process.env.NEXT_PUBLIC_ANALYTICS_WRITE_KEY;

function dispatch(event: AnalyticsEvent) {
  if (!writeKey) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("[analytics:noop]", event.name, "properties" in event ? event.properties : undefined);
    }
    return;
  }
  // Real provider integration goes here once NEXT_PUBLIC_ANALYTICS_WRITE_KEY is set.
}

export function track(event: AnalyticsEvent) {
  try {
    dispatch(event);
  } catch {
    // Analytics must never break the product experience.
  }
}
