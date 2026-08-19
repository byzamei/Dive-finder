/**
 * Two claims for the same (entity, field) "conflict" when their values
 * differ. Used to decide whether a new claim should be pushed into the
 * admin review queue as a visible dispute rather than silently treated as
 * an update — see docs/data-governance.md "Conflicting sources".
 */
export function claimsConflict(existingValueJson: unknown, newValueJson: unknown): boolean {
  return JSON.stringify(existingValueJson) !== JSON.stringify(newValueJson);
}
