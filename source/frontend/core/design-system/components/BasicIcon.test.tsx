// @manualReviewRequested: 2026-07-06
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BasicIcon, type BasicIconName } from "./BasicIcon";

const ALL_NAMES: BasicIconName[] = [
  "plus",
  "trash",
  "skip-forward",
  "undo",
  "close",
  "grip",
  "check",
  "empty-square",
  "pencil",
  "chevron-down",
  "chevron-right",
];

describe("BasicIcon", () => {
  it("renders with an accessible label", () => {
    render(<BasicIcon name="trash" label="Delete" />);
    expect(screen.getByRole("img", { name: "Delete" })).toBeInTheDocument();
  });

  it.each(ALL_NAMES)("renders the %s glyph without crashing", (name) => {
    render(<BasicIcon name={name} label="Icon" />);
    expect(screen.getByRole("img", { name: "Icon" }).querySelector("svg")).toBeInTheDocument();
  });
});
