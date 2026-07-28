import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TaskDueDateField } from "./task-due-date-field";

describe("TaskDueDateField", () => {
  it("renders the given value", () => {
    render(<TaskDueDateField value="2026-08-01" onChange={vi.fn()} aria-label="Due date" />);

    expect(screen.getByLabelText("Due date")).toHaveValue("2026-08-01");
  });

  it("renders an empty value when null", () => {
    render(<TaskDueDateField value={null} onChange={vi.fn()} aria-label="Due date" />);

    expect(screen.getByLabelText("Due date")).toHaveValue("");
  });

  it("calls onChange with the new date on change", () => {
    const onChange = vi.fn();
    render(<TaskDueDateField value={null} onChange={onChange} aria-label="Due date" />);

    fireEvent.change(screen.getByLabelText("Due date"), { target: { value: "2026-08-01" } });

    expect(onChange).toHaveBeenCalledWith("2026-08-01");
  });

  it("calls onChange with null when cleared", () => {
    const onChange = vi.fn();
    render(<TaskDueDateField value="2026-08-01" onChange={onChange} aria-label="Due date" />);

    fireEvent.change(screen.getByLabelText("Due date"), { target: { value: "" } });

    expect(onChange).toHaveBeenCalledWith(null);
  });
});
