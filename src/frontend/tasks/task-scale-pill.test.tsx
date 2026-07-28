import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TaskScalePill } from "./task-scale-pill";

describe("TaskScalePill", () => {
  it("renders the label", () => {
    render(<TaskScalePill label="Energy" value={3} onChange={vi.fn()} />);

    expect(screen.getByText("Energy")).toBeInTheDocument();
  });

  it("calls onChange with the clicked segment's level", () => {
    const onChange = vi.fn();
    render(<TaskScalePill label="Energy" value={2} onChange={onChange} />);

    screen.getAllByRole("button", { name: /^Energy: level/ })[4].click();

    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("calls onChange with null when the clear button is clicked", () => {
    const onChange = vi.fn();
    render(<TaskScalePill label="Energy" value={3} onChange={onChange} />);

    screen.getByRole("button", { name: "Clear energy" }).click();

    expect(onChange).toHaveBeenCalledWith(null);
  });
});
