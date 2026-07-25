import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TaskCreateForm } from "./task-create-form";

describe("TaskCreateForm", () => {
  it("disables the submit button when the title is empty", () => {
    render(<TaskCreateForm onCreate={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Add task" })).toBeDisabled();
  });

  it("calls onCreate with the trimmed title and description, then clears the form", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<TaskCreateForm onCreate={onCreate} />);

    fireEvent.change(screen.getByLabelText("Task title"), { target: { value: "  Buy milk  " } });
    fireEvent.change(screen.getByLabelText("Task description"), { target: { value: "  2%  " } });
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledWith("Buy milk", "2%"));
    await waitFor(() => expect(screen.getByLabelText("Task title")).toHaveValue(""));
    expect(screen.getByLabelText("Task description")).toHaveValue("");
  });

  it("does not call onCreate when the title is only whitespace", () => {
    const onCreate = vi.fn();
    render(<TaskCreateForm onCreate={onCreate} />);

    fireEvent.change(screen.getByLabelText("Task title"), { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));

    expect(onCreate).not.toHaveBeenCalled();
  });
});
