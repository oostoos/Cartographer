const CLOCK_TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
const SHORT_DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
const SHORT_DATE_WITH_YEAR_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  ...SHORT_DATE_FORMAT_OPTIONS,
  year: "numeric",
};

/** True if two dates fall on the same calendar day in the local timezone. */
export function isSameLocalDay(a: Date, b: Date): boolean {
  if (a.getFullYear() !== b.getFullYear()) {
    return false;
  }
  
  if (a.getMonth() !== b.getMonth()) {
    return false;
  }

  if (a.getDate() !== b.getDate()) {
    return false;
  }

  return true;
}

/** Format a date as a local clock time, e.g. "3:45 PM". */
export function formatLocalClockTime(date: Date): string {
  return new Intl.DateTimeFormat(undefined, CLOCK_TIME_FORMAT_OPTIONS).format(date);
}

/** Format a date as a short local date, e.g. "Jul 20" (adds the year if it differs from `now`'s year). */
export function formatShortLocalDate(date: Date, now: Date = new Date()): string {
  return new Intl.DateTimeFormat(undefined, getDateTimeFormatOptions(date, now)).format(date);
}

function getDateTimeFormatOptions(date: Date, now: Date): Intl.DateTimeFormatOptions {
  return date.getFullYear() === now.getFullYear() ? SHORT_DATE_FORMAT_OPTIONS : SHORT_DATE_WITH_YEAR_FORMAT_OPTIONS;
}
