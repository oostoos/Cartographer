// @manualReviewRequested: 2026-07-06
/** Returns today's local calendar date as "YYYY-MM-DD" — never `toISOString().slice(0, 10)`,
 * which returns the *UTC* date and drifts a day off local "today" whenever the two differ (e.g.
 * near midnight in most timezones). Mirrors the backend's local-date-only convention (see
 * core/utils/clock.py).
 */
export function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
