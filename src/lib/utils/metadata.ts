import type { Metadata } from "next";

/**
 * Shared Open Graph / Twitter card builder for detail pages (destination,
 * site, species) — without this, sharing a DiveFinder link on WhatsApp,
 * iMessage, or social apps showed a bare link with no preview. `imageUrl`
 * is optional since not every entity has a real, sourced photo yet (Pexels
 * search can come back empty) — falls back to a text-only card rather than
 * a broken or placeholder image link.
 */
export function buildPageMetadata({
  title,
  description,
  imageUrl,
}: {
  title: string;
  description: string;
  imageUrl?: string | null;
}): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "DiveFinder",
      ...(imageUrl ? { images: [{ url: imageUrl }] } : {}),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}
