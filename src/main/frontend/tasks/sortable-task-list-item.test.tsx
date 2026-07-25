import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";

import { SortableTaskListItem } from "./sortable-task-list-item";
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
};

function renderItem(onToggleCompleted = vi.fn()) {
  return render(
    <MemoryRouter>
      <DndContext>
        <SortableContext items={[TASK.id]}>
          <ul>
            <SortableTaskListItem task={TASK} onToggleCompleted={onToggleCompleted} />
          </ul>
        </SortableContext>
      </DndContext>
    </MemoryRouter>,
  );
}

describe("SortableTaskListItem", () => {
  it("renders the wrapped task's title and checkbox", () => {
    renderItem();

    expect(screen.getByRole("link", { name: "Buy milk" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("renders an accessible drag handle for the task", () => {
    renderItem();

    expect(screen.getByRole("button", { name: 'Reorder "Buy milk"' })).toBeInTheDocument();
  });

  it("calls onToggleCompleted when the checkbox is toggled", () => {
    const onToggleCompleted = vi.fn();
    renderItem(onToggleCompleted);

    screen.getByRole("checkbox").click();

    expect(onToggleCompleted).toHaveBeenCalledWith(true);
  });
});
