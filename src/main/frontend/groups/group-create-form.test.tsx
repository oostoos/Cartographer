import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GroupCreateForm } from "./group-create-form";

describe("GroupCreateForm", () => {
  it("disables the submit button when the name is empty", () => {
    render(<GroupCreateForm onCreate={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();
  });

  it("calls onCreate with the trimmed name, then clears the form", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<GroupCreateForm onCreate={onCreate} />);

    fireEvent.change(screen.getByLabelText("Group name"), { target: { value: "  Home renovation  " } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledWith("Home renovation"));
    await waitFor(() => expect(screen.getByLabelText("Group name")).toHaveValue(""));
  });

  it("does not call onCreate when the name is only whitespace", () => {
    const onCreate = vi.fn();
    render(<GroupCreateForm onCreate={onCreate} />);

    fireEvent.change(screen.getByLabelText("Group name"), { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(onCreate).not.toHaveBeenCalled();
  });
});
