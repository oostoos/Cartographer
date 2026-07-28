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
  group_id: null,
  energy_requirement: null,
  impact: null,
  due_date: null,
  time_estimate_minutes: null,
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

  it("renders a group pill when groupName and onRemoveGroup are given", () => {
    render(
      <MemoryRouter>
        <TaskListItem task={TASK} onToggleCompleted={vi.fn()} groupName="Home renovation" onRemoveGroup={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Home renovation")).toBeInTheDocument();
  });

  it("calls onRemoveGroup when the pill's remove button is clicked", () => {
    const onRemoveGroup = vi.fn();
    render(
      <MemoryRouter>
        <TaskListItem
          task={TASK}
          onToggleCompleted={vi.fn()}
          groupName="Home renovation"
          onRemoveGroup={onRemoveGroup}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove from Home renovation" }));

    expect(onRemoveGroup).toHaveBeenCalled();
  });

  it("renders no group pill when groupName is not given", () => {
    renderItem(TASK);

    expect(screen.queryByText("Home renovation")).not.toBeInTheDocument();
  });

  it("renders a delete button when onDelete is given", () => {
    render(
      <MemoryRouter>
        <TaskListItem task={TASK} onToggleCompleted={vi.fn()} onDelete={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: 'Delete "Buy milk"' })).toBeInTheDocument();
  });

  it("calls onDelete when the delete button is clicked", () => {
    const onDelete = vi.fn();
    render(
      <MemoryRouter>
        <TaskListItem task={TASK} onToggleCompleted={vi.fn()} onDelete={onDelete} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: 'Delete "Buy milk"' }));

    expect(onDelete).toHaveBeenCalled();
  });

  it("renders no delete button when onDelete is not given", () => {
    renderItem(TASK);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders an energy pill when energy_requirement and onSetEnergyRequirement are given", () => {
    render(
      <MemoryRouter>
        <TaskListItem
          task={{ ...TASK, energy_requirement: 3 }}
          onToggleCompleted={vi.fn()}
          onSetEnergyRequirement={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Energy")).toBeInTheDocument();
  });

  it("renders no energy pill when energy_requirement is null", () => {
    render(
      <MemoryRouter>
        <TaskListItem task={TASK} onToggleCompleted={vi.fn()} onSetEnergyRequirement={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.queryByText("Energy")).not.toBeInTheDocument();
  });

  it("renders no energy pill when onSetEnergyRequirement is not given, even if energy_requirement is set", () => {
    renderItem({ ...TASK, energy_requirement: 3 });

    expect(screen.queryByText("Energy")).not.toBeInTheDocument();
  });

  it("renders an impact pill when impact and onSetImpact are given", () => {
    render(
      <MemoryRouter>
        <TaskListItem task={{ ...TASK, impact: 4 }} onToggleCompleted={vi.fn()} onSetImpact={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Impact")).toBeInTheDocument();
  });

  it("renders a due date field when due_date and onSetDueDate are given", () => {
    render(
      <MemoryRouter>
        <TaskListItem
          task={{ ...TASK, due_date: "2026-08-01" }}
          onToggleCompleted={vi.fn()}
          onSetDueDate={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('"Buy milk" due date')).toHaveValue("2026-08-01");
  });

  it("renders a time estimate pill when time_estimate_minutes and onSetTimeEstimateMinutes are given", () => {
    render(
      <MemoryRouter>
        <TaskListItem
          task={{ ...TASK, time_estimate_minutes: 45 }}
          onToggleCompleted={vi.fn()}
          onSetTimeEstimateMinutes={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("45m")).toBeInTheDocument();
  });

  it("calls onSetEnergyRequirement with the clicked level", () => {
    const onSetEnergyRequirement = vi.fn();
    render(
      <MemoryRouter>
        <TaskListItem
          task={{ ...TASK, energy_requirement: 2 }}
          onToggleCompleted={vi.fn()}
          onSetEnergyRequirement={onSetEnergyRequirement}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getAllByRole("button", { name: /^Energy: level/ })[4]);

    expect(onSetEnergyRequirement).toHaveBeenCalledWith(5);
  });
});
