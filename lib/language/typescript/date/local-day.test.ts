import { describe, expect, it } from "vitest";

import {
  formatLocalClockTime,
  formatShortLocalDate,
  isSameLocalDay,
  isSameLocalMonth,
  isSameLocalYear,
} from "./local-day";

describe("isSameLocalYear", () => {
  it("returns true for two dates in the same year", () => {
    expect(isSameLocalYear(new Date(2026, 0, 1), new Date(2026, 11, 31))).toBe(true);
  });

  it("returns false for two dates in different years", () => {
    expect(isSameLocalYear(new Date(2025, 11, 31), new Date(2026, 0, 1))).toBe(false);
  });
});

describe("isSameLocalMonth", () => {
  it("returns true for two dates in the same month and year", () => {
    expect(isSameLocalMonth(new Date(2026, 6, 1), new Date(2026, 6, 25))).toBe(true);
  });

  it("returns false for the same month in a different year", () => {
    expect(isSameLocalMonth(new Date(2025, 6, 25), new Date(2026, 6, 25))).toBe(false);
  });

  it("returns false for different months in the same year", () => {
    expect(isSameLocalMonth(new Date(2026, 5, 25), new Date(2026, 6, 25))).toBe(false);
  });
});

describe("isSameLocalDay", () => {
  it("returns true for two times on the same calendar day", () => {
    expect(isSameLocalDay(new Date(2026, 6, 25, 1, 0), new Date(2026, 6, 25, 23, 59))).toBe(true);
  });

  it("returns false across a midnight boundary", () => {
    expect(isSameLocalDay(new Date(2026, 6, 25, 23, 59), new Date(2026, 6, 26, 0, 1))).toBe(false);
  });

  it("returns false for the same day/month in a different year", () => {
    expect(isSameLocalDay(new Date(2025, 6, 25), new Date(2026, 6, 25))).toBe(false);
  });
});

describe("formatLocalClockTime", () => {
  it("formats a morning time with AM", () => {
    expect(formatLocalClockTime(new Date(2026, 6, 25, 9, 5))).toMatch(/9:05\s*AM/);
  });

  it("formats an afternoon time with PM", () => {
    expect(formatLocalClockTime(new Date(2026, 6, 25, 15, 45))).toMatch(/3:45\s*PM/);
  });

  it("formats noon as 12 PM", () => {
    expect(formatLocalClockTime(new Date(2026, 6, 25, 12, 0))).toMatch(/12:00\s*PM/);
  });

  it("formats midnight as 12 AM", () => {
    expect(formatLocalClockTime(new Date(2026, 6, 25, 0, 0))).toMatch(/12:00\s*AM/);
  });
});

describe("formatShortLocalDate", () => {
  it("omits the year when it matches now's year", () => {
    const date = new Date(2026, 6, 20);
    const now = new Date(2026, 6, 25);
    expect(formatShortLocalDate(date, now)).toBe("Jul 20");
  });

  it("includes the year when it differs from now's year", () => {
    const date = new Date(2025, 6, 20);
    const now = new Date(2026, 6, 25);
    expect(formatShortLocalDate(date, now)).toBe("Jul 20, 2025");
  });

  it("defaults now to the current date when not provided", () => {
    expect(formatShortLocalDate(new Date())).not.toBe("");
  });
});
