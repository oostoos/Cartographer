import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SegmentedScale } from "./segmented-scale";

describe("SegmentedScale", () => {
  it("renders segmentCount segments", () => {
    render(<SegmentedScale segmentCount={5} value={null} onChange={vi.fn()} aria-label="Energy" />);

    expect(screen.getAllByRole("button")).toHaveLength(5);
  });

  it("fills segments up to and including the current value", () => {
    render(<SegmentedScale segmentCount={5} value={3} onChange={vi.fn()} aria-label="Energy" />);

    const segments = screen.getAllByRole("button");
    expect(segments[0]).toHaveAttribute("data-filled", "true");
    expect(segments[1]).toHaveAttribute("data-filled", "true");
    expect(segments[2]).toHaveAttribute("data-filled", "true");
    expect(segments[3]).toHaveAttribute("data-filled", "false");
    expect(segments[4]).toHaveAttribute("data-filled", "false");
  });

  it("renders no filled segments when value is null", () => {
    render(<SegmentedScale segmentCount={5} value={null} onChange={vi.fn()} aria-label="Energy" />);

    for (const segment of screen.getAllByRole("button")) {
      expect(segment).toHaveAttribute("data-filled", "false");
    }
  });

  it("calls onChange with the clicked segment's level", () => {
    const onChange = vi.fn();
    render(<SegmentedScale segmentCount={5} value={null} onChange={onChange} aria-label="Energy" />);

    screen.getAllByRole("button")[2].click();

    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("renders as read-only (no buttons) when onChange is omitted", () => {
    render(<SegmentedScale segmentCount={5} value={3} aria-label="Energy" />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("still shows the fill state when read-only", () => {
    const { container } = render(<SegmentedScale segmentCount={5} value={3} aria-label="Energy" />);

    const segments = container.querySelectorAll(".segmented-scale__segment");
    expect(segments[0]).toHaveAttribute("data-filled", "true");
    expect(segments[3]).toHaveAttribute("data-filled", "false");
  });
});
