import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProjectCreateForm } from "./project-create-form";

describe("ProjectCreateForm", () => {
  it("disables the submit button when the name is empty", () => {
    render(<ProjectCreateForm onCreate={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();
  });

  it("calls onCreate with the trimmed name, then clears the form", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<ProjectCreateForm onCreate={onCreate} />);

    fireEvent.change(screen.getByLabelText("Project name"), { target: { value: "  Home renovation  " } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledWith("Home renovation"));
    await waitFor(() => expect(screen.getByLabelText("Project name")).toHaveValue(""));
  });

  it("does not call onCreate when the name is only whitespace", () => {
    const onCreate = vi.fn();
    render(<ProjectCreateForm onCreate={onCreate} />);

    fireEvent.change(screen.getByLabelText("Project name"), { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(onCreate).not.toHaveBeenCalled();
  });
});
