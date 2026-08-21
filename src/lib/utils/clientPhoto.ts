"use client";

// Client-side helper for components that can't call photoService directly
// (it's server-only, to keep PEXELS_API_KEY out of the browser bundle) —
// goes through /api/photo instead. Used by any "use client" card grid that
// wants a real photo with a graceful null on any failure.

export interface CardPhoto {
  url: string;
  alt: string;
}

export async function fetchPhoto(query: string): Promise<CardPhoto | null> {
  try {
    const res = await fetch(`/api/photo?q=${encodeURIComponent(query)}`);
    if (!res.ok) return null;
    const { photo } = (await res.json()) as { photo: CardPhoto | null };
    return photo;
  } catch {
    return null;
  }
}
