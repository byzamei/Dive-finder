import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Personal/gated pages (saved, profile, logbook, reservations, feed) and
// query-driven pages with no canonical single URL (results, compare) are
// disallowed — RLS already protects the data, this just keeps a crawler
// from indexing thin "sign in to see this" pages instead of real content.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/auth",
        "/login",
        "/saved",
        "/profile",
        "/logbook",
        "/reservations",
        "/feed",
        "/compare",
        "/results",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
