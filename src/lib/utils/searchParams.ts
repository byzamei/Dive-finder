import type { SearchCriteria } from "@/lib/types/domain";

// Search criteria are encoded as a single base64url JSON query param ("c")
// rather than one param per field — the criteria shape has arrays/optional
// numeric ranges that don't map cleanly to flat query strings, and nothing
// here needs to be a human-typed URL.

export function encodeCriteria(criteria: SearchCriteria): string {
  const json = JSON.stringify(criteria);
  if (typeof window === "undefined") return Buffer.from(json).toString("base64url");
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodeCriteria(encoded: string | null): SearchCriteria {
  if (!encoded) return {};
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const json =
      typeof window === "undefined"
        ? Buffer.from(base64, "base64").toString("utf-8")
        : decodeURIComponent(escape(atob(base64)));
    return JSON.parse(json) as SearchCriteria;
  } catch {
    return {};
  }
}
