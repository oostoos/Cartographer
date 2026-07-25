import { describe, expect, it } from "vitest";

import { getInitials } from "./initials";

describe("getInitials", () => {
  it("takes the first letter of the first two words by default", () => {
    expect(getInitials("Austin Shank")).toBe("AS");
  });

  it("uppercases lowercase input", () => {
    expect(getInitials("austin shank")).toBe("AS");
  });

  it("returns a single initial for a one-word name", () => {
    expect(getInitials("Austin")).toBe("A");
  });

  it("returns an empty string for a blank name", () => {
    expect(getInitials("")).toBe("");
    expect(getInitials("   ")).toBe("");
  });

  it("collapses repeated whitespace between words", () => {
    expect(getInitials("Austin   Shank")).toBe("AS");
  });

  it("ignores words beyond maxInitials", () => {
    expect(getInitials("Austin James Shank")).toBe("AJ");
  });

  it("respects a custom maxInitials", () => {
    expect(getInitials("Austin James Shank", 3)).toBe("AJS");
    expect(getInitials("Austin James Shank", 1)).toBe("A");
  });

  it("trims leading/trailing whitespace", () => {
    expect(getInitials("  Austin Shank  ")).toBe("AS");
  });
});
