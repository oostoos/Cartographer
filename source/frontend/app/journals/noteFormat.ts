// @manualReviewRequested: 2026-07-07
import { todayIsoDate } from "../../core/utils/date";

/** Returns the local "YYYY-MM-DD" date some number of days before today — used only to recognize
 * "yesterday" for formatDateSeparator, computed from local date parts (not UTC) for the same
 * reason todayIsoDate() itself avoids toISOString().
 */
function isoDateDaysAgo(days: number): string {
  const [year, month, day] = todayIsoDate().split("-").map(Number);
  const date = new Date(year, month - 1, day - days);
  const paddedMonth = String(date.getMonth() + 1).padStart(2, "0");
  const paddedDay = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${paddedMonth}-${paddedDay}`;
}

/** Formats a note's createdAt timestamp as a plain time-of-day, for display on its card. */
export function formatNoteTime(createdAt: string): string {
  return new Date(createdAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** Formats a note feed's per-day date separator: "Today"/"Yesterday" for the two most recent
 * days, a short month/day date otherwise (with the year added only when it isn't the current
 * one).
 */
export function formatDateSeparator(dateIso: string): string {
  if (dateIso === todayIsoDate()) return "Today";
  if (dateIso === isoDateDaysAgo(1)) return "Yesterday";
  const isCurrentYear = dateIso.slice(0, 4) === todayIsoDate().slice(0, 4);
  return new Date(`${dateIso}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: isCurrentYear ? undefined : "numeric",
  });
}
