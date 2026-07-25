import { describe, expect, it } from "vitest";

import { formatCompletionLabel } from "./format-completion-label";

describe("formatCompletionLabel", () => {
  it("labels a same-day completion as 'today at <time>'", () => {
    const now = new Date(2026, 6, 25, 16, 0);
    const completedAt = new Date(2026, 6, 25, 15, 45).toISOString();

    expect(formatCompletionLabel(completedAt, now)).toMatch(/^today at 3:45\s*PM$/);
  });

  it("labels a prior-day completion as 'on <short date>'", () => {
    const now = new Date(2026, 6, 25, 16, 0);
    const completedAt = new Date(2026, 6, 20, 9, 0).toISOString();

    expect(formatCompletionLabel(completedAt, now)).toBe("on Jul 20");
  });

  it("includes the year when the completion happened in a prior calendar year", () => {
    const now = new Date(2026, 6, 25, 16, 0);
    const completedAt = new Date(2025, 6, 20, 9, 0).toISOString();

    expect(formatCompletionLabel(completedAt, now)).toBe("on Jul 20, 2025");
  });
});
