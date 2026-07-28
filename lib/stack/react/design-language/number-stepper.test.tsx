import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NumberStepper } from "./number-stepper";

describe("NumberStepper", () => {
  it("shows a placeholder when value is null", () => {
    render(<NumberStepper value={null} step={15} onChange={vi.fn()} aria-label="Time estimate" />);

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("displays the value via formatValue when set", () => {
    render(
      <NumberStepper
        value={45}
        step={15}
        onChange={vi.fn()}
        formatValue={(value) => `${value} min`}
        aria-label="Time estimate"
      />,
    );

    expect(screen.getByText("45 min")).toBeInTheDocument();
  });

  it("increments from null to the minimum", () => {
    const onChange = vi.fn();
    render(<NumberStepper value={null} step={15} onChange={onChange} aria-label="Time estimate" />);

    screen.getByRole("button", { name: "Increase Time estimate" }).click();

    expect(onChange).toHaveBeenCalledWith(15);
  });

  it("increments by step from an existing value", () => {
    const onChange = vi.fn();
    render(<NumberStepper value={30} step={15} onChange={onChange} aria-label="Time estimate" />);

    screen.getByRole("button", { name: "Increase Time estimate" }).click();

    expect(onChange).toHaveBeenCalledWith(45);
  });

  it("decrements by step above the minimum", () => {
    const onChange = vi.fn();
    render(<NumberStepper value={45} step={15} onChange={onChange} aria-label="Time estimate" />);

    screen.getByRole("button", { name: "Decrease Time estimate" }).click();

    expect(onChange).toHaveBeenCalledWith(30);
  });

  it("clears to null when decrementing below the minimum", () => {
    const onChange = vi.fn();
    render(<NumberStepper value={15} step={15} onChange={onChange} aria-label="Time estimate" />);

    screen.getByRole("button", { name: "Decrease Time estimate" }).click();

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("disables the decrement button when value is already null", () => {
    render(<NumberStepper value={null} step={15} onChange={vi.fn()} aria-label="Time estimate" />);

    expect(screen.getByRole("button", { name: "Decrease Time estimate" })).toBeDisabled();
  });
});
