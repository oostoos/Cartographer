import { formatShortLocalDate } from "@lib/index";

/** Human-readable label for a task's due date (a bare "YYYY-MM-DD" string), e.g. "Aug 1".
 * Parses the date's year/month/day directly rather than via `new Date(dueDate)`, which would
 * interpret a bare date string as UTC midnight and could shift it to the wrong local day. */
export function formatDueDateLabel(dueDate: string, now: Date = new Date()): string {
  const [year, month, day] = dueDate.split("-").map(Number);
  const localDate = new Date(year, month - 1, day);
  return formatShortLocalDate(localDate, now);
}
