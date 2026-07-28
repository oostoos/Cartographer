import { describe, expect, it } from "vitest";

import { formatDueDateLabel } from "./format-due-date-label";

describe("formatDueDateLabel", () => {
  it("formats a bare date string as a short local date", () => {
    const now = new Date(2026, 6, 25);

    expect(formatDueDateLabel("2026-08-01", now)).toBe("Aug 1");
  });

  it("includes the year when the due date is in a prior calendar year", () => {
    const now = new Date(2026, 6, 25);

    expect(formatDueDateLabel("2025-08-01", now)).toBe("Aug 1, 2025");
  });

  it("does not shift the date across a UTC day boundary", () => {
    const now = new Date(2026, 6, 25);

    expect(formatDueDateLabel("2026-01-01", now)).toBe("Jan 1");
  });
});
