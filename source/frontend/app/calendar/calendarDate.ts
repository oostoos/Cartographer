// @manualReviewRequested: 2026-07-07
/** Date/grid math shared by CalendarWeekView and CalendarMonthView — the one place "what dates
 * does this week/month span" and "where does a time-of-day land on the grid" are computed, so the
 * two views (and blockColor-style positioning) stay consistent instead of each hand-rolling their
 * own, as the old BlockWeekGrid/BlockCompletionCalendar independently did.
 */

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** Builds a "YYYY-MM-DD" string from a Date's local year/month/day — never
 * `date.toISOString().slice(0, 10)`, which drifts to the UTC date (see core/utils/date.ts).
 */
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Parses a "YYYY-MM-DD" string as a local-midnight Date. */
export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Returns the ISO date delta days after (or, with a negative delta, before) iso. */
export function addDays(iso: string, delta: number): string {
  const date = parseIsoDate(iso);
  date.setDate(date.getDate() + delta);
  return toIsoDate(date);
}

/** Returns the Monday on or before iso's week — the anchor every week view is built from. */
export function startOfWeek(iso: string): string {
  const date = parseIsoDate(iso);
  const mondayOffset = (date.getDay() + 6) % 7; // 0=Mon..6=Sun
  date.setDate(date.getDate() - mondayOffset);
  return toIsoDate(date);
}

/** Builds the 7 ISO dates (Monday through Sunday) of the week starting at weekStartIso. */
export function buildWeekDates(weekStartIso: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStartIso, index));
}

/** Builds one month's calendar grid as a Monday-start, 7-column list of cells covering full
 * weeks: an ISO date for each day in the month, or null for a leading/trailing cell that belongs
 * to an adjacent month (rendered blank, never fetched).
 */
export function buildMonthGrid(year: number, month: number): (string | null)[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // 0=Mon..6=Sun
  const cells: (string | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from(
      { length: daysInMonth },
      (_, index) => `${year}-${pad2(month + 1)}-${pad2(index + 1)}`,
    ),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** Shifts iso's month by delta months, returning the 1st of the resulting month. */
export function shiftMonth(iso: string, delta: number): string {
  const date = parseIsoDate(iso);
  return toIsoDate(new Date(date.getFullYear(), date.getMonth() + delta, 1));
}

/** Parses an "HH:MM" time-of-day into minutes since midnight. */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/** Formats an hour (0-23) as a 12-hour label, e.g. 6 -> "6 AM", 13 -> "1 PM". */
export function formatHour(hour24: number): string {
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12} ${period}`;
}
