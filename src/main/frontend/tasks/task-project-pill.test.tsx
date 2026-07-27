import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TaskProjectPill } from "./task-project-pill";

describe("TaskProjectPill", () => {
  it("renders the project name", () => {
    render(<TaskProjectPill projectName="Home renovation" onRemove={vi.fn()} />);

    expect(screen.getByText("Home renovation")).toBeInTheDocument();
  });

  it("calls onRemove when the remove button is clicked", () => {
    const onRemove = vi.fn();
    render(<TaskProjectPill projectName="Home renovation" onRemove={onRemove} />);

    fireEvent.click(screen.getByRole("button", { name: "Remove from Home renovation" }));

    expect(onRemove).toHaveBeenCalled();
  });
});
