// Simple static feature flags for V1. Community review submission was
// modeled in the schema (see `reviews` table) but kept off until submission
// UI and moderation tooling existed (see §15 of the product brief). Both are
// now built — src/components/reviews/*, /admin/reviews — so the flag is on.
export const featureFlags = {
  communityReviewSubmission: true,
  googleOAuth: Boolean(process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true"),
} as const;
