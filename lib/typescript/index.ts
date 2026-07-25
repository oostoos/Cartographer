// TypeScript library barrel: generic, stack-agnostic building blocks.
// Import from here rather than reaching into individual library modules directly.

// http — generic HTTP helpers
export { requestJson } from "./http/json-client";

// date — generic date/time formatting helpers
export { formatLocalClockTime, formatShortLocalDate, isSameLocalDay } from "./date/local-day";

// string — generic string helpers
export { getInitials } from "./string/initials";
