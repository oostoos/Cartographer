import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { TaskListItem } from "./task-list-item";
import type { TTask } from "./types";

const TASK: TTask = {
  id: "abc123",
  title: "Buy milk",
  description: "",
  completed: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

function renderItem(task: TTask, onToggleCompleted = vi.fn()) {
  return render(
    <MemoryRouter>
      <TaskListItem task={task} onToggleCompleted={onToggleCompleted} />
    </MemoryRouter>,
  );
}

describe("TaskListItem", () => {
  it("renders the task title as a link to its detail page", () => {
    renderItem(TASK);

    expect(screen.getByRole("link", { name: "Buy milk" })).toHaveAttribute("href", "/tasks/abc123");
  });

  it("renders an unchecked checkbox for an incomplete task", () => {
    renderItem(TASK);

    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("renders a checked checkbox for a completed task", () => {
    renderItem({ ...TASK, completed: true });

    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("calls onToggleCompleted with the new value when the checkbox is toggled", () => {
    const onToggleCompleted = vi.fn();
    renderItem(TASK, onToggleCompleted);

    fireEvent.click(screen.getByRole("checkbox"));

    expect(onToggleCompleted).toHaveBeenCalledWith(true);
  });

  it("does not toggle the checkbox when clicking the title link", () => {
    const onToggleCompleted = vi.fn();
    renderItem(TASK, onToggleCompleted);

    fireEvent.click(screen.getByRole("link", { name: "Buy milk" }));

    expect(onToggleCompleted).not.toHaveBeenCalled();
  });
});
