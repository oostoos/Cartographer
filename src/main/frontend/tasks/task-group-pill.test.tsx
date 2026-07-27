import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TaskGroupPill } from "./task-group-pill";

describe("TaskGroupPill", () => {
  it("renders the group name", () => {
    render(<TaskGroupPill groupName="Home renovation" onRemove={vi.fn()} />);

    expect(screen.getByText("Home renovation")).toBeInTheDocument();
  });

  it("calls onRemove when the remove button is clicked", () => {
    const onRemove = vi.fn();
    render(<TaskGroupPill groupName="Home renovation" onRemove={onRemove} />);

    fireEvent.click(screen.getByRole("button", { name: "Remove from Home renovation" }));

    expect(onRemove).toHaveBeenCalled();
  });
});
