// @manualReviewRequested: 2026-07-07
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { CadenceOverride } from "./blockApi";
import { RecurrencePicker } from "./RecurrencePicker";

describe("RecurrencePicker", () => {
  it("calls onChange with null when set back to 'Every time'", async () => {
    const onChange = vi.fn();
    render(
      <RecurrencePicker
        value={{ frequency: "daily", startDate: "2026-07-04", interval: 1 }}
        onChange={onChange}
      />,
    );
    // Field wraps the whole SetSelection radiogroup in one <label>, so accessible-name
    // computation folds every pill's text into the first pill's name — query by visible text
    // instead (same reasoning applies to any other SetSelection nested inside a Field).
    await userEvent.click(screen.getByText("Every time"));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("reveals weekday checkboxes only for a weekly frequency", () => {
    const weeklyValue: CadenceOverride = {
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
    const weeklyValue: CadenceOverride = {
      frequency: "weekly",
      startDate: "2026-07-06",
      interval: 1,
      daysOfWeek: [],
    };
    render(<RecurrencePicker value={weeklyValue} onChange={onChange} />);
    await userEvent.click(screen.getByRole("checkbox", { name: "Mon" }));
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

  it("clears the interval to undefined instead of 0 when its field is emptied", async () => {
    const onChange = vi.fn();
    const value: CadenceOverride = { frequency: "daily", startDate: "2026-07-04", interval: 3 };
    render(<RecurrencePicker value={value} onChange={onChange} />);
    await userEvent.clear(screen.getByLabelText("Every"));
    expect(onChange).toHaveBeenLastCalledWith({ ...value, interval: undefined });
  });

  it("clears dayOfMonth to null instead of 0 when its field is emptied", async () => {
    const onChange = vi.fn();
    const value: CadenceOverride = {
      frequency: "monthly",
      startDate: "2026-07-04",
      interval: 1,
      dayOfMonth: 15,
    };
    render(<RecurrencePicker value={value} onChange={onChange} />);
    await userEvent.clear(screen.getByLabelText("Day of month"));
    expect(onChange).toHaveBeenLastCalledWith({ ...value, dayOfMonth: null });
  });

  it("clears monthOfYear to null instead of 0 when its field is emptied", async () => {
    const onChange = vi.fn();
    const value: CadenceOverride = {
      frequency: "yearly",
      startDate: "2026-07-04",
      interval: 1,
      monthOfYear: 6,
    };
    render(<RecurrencePicker value={value} onChange={onChange} />);
    await userEvent.clear(screen.getByLabelText("Month"));
    expect(onChange).toHaveBeenLastCalledWith({ ...value, monthOfYear: null });
  });
});
