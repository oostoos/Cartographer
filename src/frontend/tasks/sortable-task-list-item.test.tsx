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
  group_id: null,
  energy_requirement: null,
  impact: null,
  due_date: null,
  time_estimate_minutes: null,
};

function renderItem(overrides: Partial<Parameters<typeof SortableTaskListItem>[0]> = {}) {
  return render(
    <MemoryRouter>
      <DndContext>
        <SortableContext items={[TASK.id]}>
          <ul>
            <SortableTaskListItem task={TASK} onToggleCompleted={vi.fn()} {...overrides} />
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
    renderItem({ onToggleCompleted });

    screen.getByRole("checkbox").click();

    expect(onToggleCompleted).toHaveBeenCalledWith(true);
  });

  it("renders a group pill when given groupName and onRemoveGroup", () => {
    renderItem({ groupName: "Home renovation", onRemoveGroup: vi.fn() });

    expect(screen.getByText("Home renovation")).toBeInTheDocument();
  });

  it("calls onRemoveGroup when the pill's remove button is clicked", () => {
    const onRemoveGroup = vi.fn();
    renderItem({ groupName: "Home renovation", onRemoveGroup });

    screen.getByRole("button", { name: "Remove from Home renovation" }).click();

    expect(onRemoveGroup).toHaveBeenCalled();
  });

  it("calls onDelete when the delete button is clicked", () => {
    const onDelete = vi.fn();
    renderItem({ onDelete });

    screen.getByRole("button", { name: 'Delete "Buy milk"' }).click();

    expect(onDelete).toHaveBeenCalled();
  });

  it("renders and wires an energy pill when given energy_requirement and onSetEnergyRequirement", () => {
    const onSetEnergyRequirement = vi.fn();
    renderItem({ task: { ...TASK, energy_requirement: 2 }, onSetEnergyRequirement });

    screen.getAllByRole("button", { name: /^Energy: level/ })[4].click();

    expect(onSetEnergyRequirement).toHaveBeenCalledWith(5);
  });
});
