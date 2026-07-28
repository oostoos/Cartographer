import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ColorSwatchPicker } from "./color-swatch-picker";

const COLORS = ["#f3d9c4", "#d7e5d3", "#d6e2ec"];

describe("ColorSwatchPicker", () => {
  it("renders one swatch per color", () => {
    render(<ColorSwatchPicker colors={COLORS} value={COLORS[0]} onChange={vi.fn()} aria-label="Group color" />);

    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("marks the swatch matching value as selected", () => {
    render(<ColorSwatchPicker colors={COLORS} value={COLORS[1]} onChange={vi.fn()} aria-label="Group color" />);

    const swatches = screen.getAllByRole("button");
    expect(swatches[0]).toHaveAttribute("data-selected", "false");
    expect(swatches[1]).toHaveAttribute("data-selected", "true");
    expect(swatches[2]).toHaveAttribute("data-selected", "false");
  });

  it("calls onChange with the clicked swatch's color", () => {
    const onChange = vi.fn();
    render(<ColorSwatchPicker colors={COLORS} value={COLORS[0]} onChange={onChange} aria-label="Group color" />);

    screen.getAllByRole("button")[2].click();

    expect(onChange).toHaveBeenCalledWith(COLORS[2]);
  });
});
