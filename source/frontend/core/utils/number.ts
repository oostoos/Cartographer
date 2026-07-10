// @manualReviewRequested: 2026-07-08
/** Parses a text input's raw string into a non-negative integer. Empty or invalid input becomes
 * 0 — this app's convention for "unset" on an optional numeric field (see Task.estimated_minutes
 * on the backend) — never NaN, and never negative (a stray "-" is clamped to 0 rather than
 * silently sent to the server, which would reject it anyway).
 */
export function parseNonNegativeInt(raw: string): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : 0;
}
