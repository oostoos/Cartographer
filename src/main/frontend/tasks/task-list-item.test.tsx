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
  completed_at: null,
  order: 0,
  project_id: null,
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

  it("shows a completion label next to the title when the task is completed with a timestamp", () => {
    renderItem({ ...TASK, completed: true, completed_at: "2026-01-01T15:45:00Z" });

    expect(screen.getByText(/^(today at|on)/)).toBeInTheDocument();
  });

  it("shows no completion label when the task is completed but has no timestamp (legacy record)", () => {
    renderItem({ ...TASK, completed: true, completed_at: null });

    expect(screen.queryByText(/^(today at|on)/)).not.toBeInTheDocument();
  });

  it("shows no completion label for an incomplete task", () => {
    renderItem(TASK);

    expect(screen.queryByText(/^(today at|on)/)).not.toBeInTheDocument();
  });

  it("renders a given dragHandle", () => {
    render(
      <MemoryRouter>
        <TaskListItem task={TASK} onToggleCompleted={vi.fn()} dragHandle={<button>Drag me</button>} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "Drag me" })).toBeInTheDocument();
  });

  it("renders no drag handle when none is given", () => {
    renderItem(TASK);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders a project pill when projectName and onRemoveProject are given", () => {
    render(
      <MemoryRouter>
        <TaskListItem task={TASK} onToggleCompleted={vi.fn()} projectName="Home renovation" onRemoveProject={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Home renovation")).toBeInTheDocument();
  });

  it("calls onRemoveProject when the pill's remove button is clicked", () => {
    const onRemoveProject = vi.fn();
    render(
      <MemoryRouter>
        <TaskListItem
          task={TASK}
          onToggleCompleted={vi.fn()}
          projectName="Home renovation"
          onRemoveProject={onRemoveProject}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove from Home renovation" }));

    expect(onRemoveProject).toHaveBeenCalled();
  });

  it("renders no project pill when projectName is not given", () => {
    renderItem(TASK);

    expect(screen.queryByText("Home renovation")).not.toBeInTheDocument();
  });
});
