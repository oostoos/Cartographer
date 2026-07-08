// @manualReviewRequested: 2026-07-07
import { todayIsoDate } from "../../core/utils/date";

/** Formats a task's completedAt timestamp for inline display next to its title: just the time if
 * it was completed today, or the date if it was completed before today.
 */
export function formatCompletedAt(completedAt: string): string {
  const completedDate = new Date(completedAt);
  const wasCompletedToday = completedAt.slice(0, 10) === todayIsoDate();
  return wasCompletedToday
    ? completedDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : completedDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
