import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TaskTimeEstimatePill } from "./task-time-estimate-pill";

describe("TaskTimeEstimatePill", () => {
  it("renders the formatted estimate", () => {
    render(<TaskTimeEstimatePill value={90} onChange={vi.fn()} />);

    expect(screen.getByText("1h 30m")).toBeInTheDocument();
  });

  it("increases the estimate by 15 minutes", () => {
    const onChange = vi.fn();
    render(<TaskTimeEstimatePill value={30} onChange={onChange} />);

    screen.getByRole("button", { name: "Increase Time estimate" }).click();

    expect(onChange).toHaveBeenCalledWith(45);
  });

  it("clears the estimate when decrementing below 15 minutes", () => {
    const onChange = vi.fn();
    render(<TaskTimeEstimatePill value={15} onChange={onChange} />);

    screen.getByRole("button", { name: "Decrease Time estimate" }).click();

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("renders read-only plain text with no stepper buttons when onChange is omitted", () => {
    render(<TaskTimeEstimatePill value={90} />);

    expect(screen.getByText("1h 30m")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
