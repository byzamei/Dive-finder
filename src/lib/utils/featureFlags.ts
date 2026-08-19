// Simple static feature flags for V1. Community review submission is
// modeled in the schema (see `reviews` table) but its submission UI stays
// OFF by default per the product brief (§15) until moderation tooling
// exists — flip this once that's ready.
export const featureFlags = {
  communityReviewSubmission: false,
  googleOAuth: Boolean(process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true"),
} as const;
