import { formatLocalClockTime, formatShortLocalDate, isSameLocalDay } from "@lib/index";

/** Human-readable completion label for a task, e.g. "today at 3:45 PM" or "on Jul 20". */
export function formatCompletionLabel(completedAt: string, now: Date = new Date()): string {
  const completedDate = new Date(completedAt);
  if (isSameLocalDay(completedDate, now)) {
    return `today at ${formatLocalClockTime(completedDate)}`;
  }
  return `on ${formatShortLocalDate(completedDate, now)}`;
}
