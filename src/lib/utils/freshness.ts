/**
 * A claim/price with no `expires_at` is treated as an estimate with no TTL
 * (never "current" in the sense of a live price, but not "stale" either —
 * see FreshnessBadge). A claim IS fresh only while `expires_at` is either
 * absent or still in the future. Used by both the UI (FreshnessBadge) and
 * data-access filters so "never show an expired claim as current" (T003)
 * has exactly one implementation to audit.
 */
export function isFresh(expiresAt: string | null, now: Date = new Date()): boolean {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() > now.getTime();
}

export function isExpired(expiresAt: string | null, now: Date = new Date()): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= now.getTime();
}
