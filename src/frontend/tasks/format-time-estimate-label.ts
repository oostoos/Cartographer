const MINUTES_PER_HOUR = 60;

/** Human-readable label for a time estimate in minutes, e.g. 90 -> "1h 30m", 45 -> "45m". */
export function formatTimeEstimateLabel(minutes: number): string {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const remainingMinutes = minutes % MINUTES_PER_HOUR;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
}
