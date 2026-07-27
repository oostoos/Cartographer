import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DndContext } from "@dnd-kit/core";

import type { TTask } from "../tasks/types";
import { GroupSidebar } from "./group-sidebar";
import type { TGroup } from "./types";

const GROUP: TGroup = {
  id: "group-1",
  name: "Home renovation",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  order: 0,
};

function buildTask(overrides: Partial<TTask>): TTask {
  return {
    id: "task-1",
    title: "Task",
    description: "",
    completed: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    completed_at: null,
    order: 0,
    group_id: null,
    ...overrides,
  };
}

function renderSidebar(overrides: Partial<Parameters<typeof GroupSidebar>[0]> = {}) {
  return render(
    <DndContext>
      <GroupSidebar
        groups={[GROUP]}
        tasks={[]}
        activeFilter={{ type: "all" }}
        onSelectFilter={vi.fn()}
        onCreateGroup={vi.fn()}
        onDeleteGroup={vi.fn()}
        {...overrides}
      />
    </DndContext>,
  );
}

describe("GroupSidebar", () => {
  it("renders the All tasks and No group filter buttons", () => {
    renderSidebar();

    expect(screen.getByRole("button", { name: "All tasks" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "No group" })).toBeInTheDocument();
  });

  it("renders a group card for each group, with its task counts", () => {
    const tasks = [buildTask({ id: "1", group_id: "group-1", completed: true }), buildTask({ id: "2", group_id: "group-1" })];
    renderSidebar({ tasks });

    expect(screen.getByText("Home renovation")).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
  });

  it("calls onSelectFilter with 'all' when All tasks is clicked", () => {
    const onSelectFilter = vi.fn();
    renderSidebar({ onSelectFilter });

    fireEvent.click(screen.getByRole("button", { name: "All tasks" }));

    expect(onSelectFilter).toHaveBeenCalledWith({ type: "all" });
  });

  it("calls onSelectFilter with 'no-group' when No group is clicked", () => {
    const onSelectFilter = vi.fn();
    renderSidebar({ onSelectFilter });

    fireEvent.click(screen.getByRole("button", { name: "No group" }));

    expect(onSelectFilter).toHaveBeenCalledWith({ type: "no-group" });
  });

  it("calls onSelectFilter with the group when its card is clicked", () => {
    const onSelectFilter = vi.fn();
    renderSidebar({ onSelectFilter });

    fireEvent.click(screen.getByText("Home renovation"));

    expect(onSelectFilter).toHaveBeenCalledWith({ type: "group", groupId: "group-1" });
  });

  it("opens the create-group modal when New group is clicked", () => {
    renderSidebar();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "New group" }));

    expect(screen.getByRole("dialog", { name: "New group" })).toBeInTheDocument();
    expect(screen.getByLabelText("Group name")).toBeInTheDocument();
  });

  it("calls onCreateGroup and closes the modal again on submit", async () => {
    const onCreateGroup = vi.fn().mockResolvedValue(undefined);
    renderSidebar({ onCreateGroup });

    fireEvent.click(screen.getByRole("button", { name: "New group" }));
    fireEvent.change(screen.getByLabelText("Group name"), { target: { value: "Side group" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(onCreateGroup).toHaveBeenCalledWith("Side group");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
