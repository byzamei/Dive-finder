import "server-only";

// Real, licensed destination photography via the Pexels API — called from
// Vercel at request time, which has normal internet access (this dev
// sandbox's own network is policy-blocked from fetching any external
// image directly, which is why DiveFinder shipped without photos until
// now: see docs/data-governance.md). Pexels' license permits free use
// without attribution, but a photographer credit is included anyway as
// standard practice.
//
// Never throws: every caller renders a graceful gradient/icon fallback,
// so a missing API key, a rate limit, or a network hiccup degrades to
// exactly what the app already showed before this existed.

export interface DestinationPhoto {
  url: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
}

const PEXELS_SEARCH_URL = "https://api.pexels.com/v1/search";

interface PexelsPhotoResponse {
  src: { large: string; large2x: string };
  alt: string | null;
  photographer: string;
  photographer_url: string;
}

interface PexelsSearchResponse {
  photos: PexelsPhotoResponse[];
}

export async function searchDestinationPhoto(query: string): Promise<DestinationPhoto | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `${PEXELS_SEARCH_URL}?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
    const res = await fetch(url, {
      headers: { Authorization: apiKey },
      // Pexels' free tier is 200 req/hour / 20,000/month — a week-long
      // cache keeps repeat destination-page views from ever re-hitting it.
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as PexelsSearchResponse;
    const photo = data.photos[0];
    if (!photo) return null;

    return {
      url: photo.src.large2x,
      alt: photo.alt || query,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
    };
  } catch {
    return null;
  }
}
