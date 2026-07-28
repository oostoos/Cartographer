import { describe, expect, it } from "vitest";

import { formatTimeEstimateLabel } from "./format-time-estimate-label";

describe("formatTimeEstimateLabel", () => {
  it("formats minutes under an hour", () => {
    expect(formatTimeEstimateLabel(45)).toBe("45m");
  });

  it("formats an exact hour with no leftover minutes", () => {
    expect(formatTimeEstimateLabel(60)).toBe("1h");
  });

  it("formats hours with leftover minutes", () => {
    expect(formatTimeEstimateLabel(90)).toBe("1h 30m");
  });

  it("formats multiple hours", () => {
    expect(formatTimeEstimateLabel(150)).toBe("2h 30m");
  });
});
