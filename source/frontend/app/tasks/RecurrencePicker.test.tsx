import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RecurrencePicker } from "./RecurrencePicker";
import type { CreateRecurringTaskTemplateInput } from "./recurrenceApi";

describe("RecurrencePicker", () => {
  it("calls onChange with null when set back to 'Doesn't repeat'", async () => {
    const onChange = vi.fn();
    render(
      <RecurrencePicker
        value={{ frequency: "daily", startDate: "2026-07-04", interval: 1 }}
        onChange={onChange}
      />,
    );
    await userEvent.selectOptions(screen.getByLabelText("Repeats"), "Doesn't repeat");
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("reveals weekday checkboxes only for a weekly frequency", () => {
    const weeklyValue: CreateRecurringTaskTemplateInput = {
      frequency: "weekly",
      startDate: "2026-07-06",
      interval: 1,
      daysOfWeek: [],
    };
    render(<RecurrencePicker value={weeklyValue} onChange={vi.fn()} />);
    expect(screen.getByText("Mon")).toBeInTheDocument();
  });

  it("toggles a weekday into daysOfWeek", async () => {
    const onChange = vi.fn();
    const weeklyValue: CreateRecurringTaskTemplateInput = {
      frequency: "weekly",
      startDate: "2026-07-06",
      interval: 1,
      daysOfWeek: [],
    };
    render(<RecurrencePicker value={weeklyValue} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText("Mon"));
    expect(onChange).toHaveBeenCalledWith({ ...weeklyValue, daysOfWeek: [0] });
  });

  it("does not render weekday checkboxes for a daily frequency", () => {
    render(
      <RecurrencePicker
        value={{ frequency: "daily", startDate: "2026-07-04", interval: 1 }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.queryByText("Mon")).not.toBeInTheDocument();
  });
});
