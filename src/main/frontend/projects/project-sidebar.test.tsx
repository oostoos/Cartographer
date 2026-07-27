import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DndContext } from "@dnd-kit/core";

import type { TTask } from "../tasks/types";
import { ProjectSidebar } from "./project-sidebar";
import type { TProject } from "./types";

const PROJECT: TProject = {
  id: "proj-1",
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
    project_id: null,
    ...overrides,
  };
}

function renderSidebar(overrides: Partial<Parameters<typeof ProjectSidebar>[0]> = {}) {
  return render(
    <DndContext>
      <ProjectSidebar
        projects={[PROJECT]}
        tasks={[]}
        activeFilter={{ type: "all" }}
        onSelectFilter={vi.fn()}
        onCreateProject={vi.fn()}
        onDeleteProject={vi.fn()}
        {...overrides}
      />
    </DndContext>,
  );
}

describe("ProjectSidebar", () => {
  it("renders the All tasks and No project filter buttons", () => {
    renderSidebar();

    expect(screen.getByRole("button", { name: "All tasks" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "No project" })).toBeInTheDocument();
  });

  it("renders a project card for each project, with its task counts", () => {
    const tasks = [buildTask({ id: "1", project_id: "proj-1", completed: true }), buildTask({ id: "2", project_id: "proj-1" })];
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

  it("calls onSelectFilter with 'no-project' when No project is clicked", () => {
    const onSelectFilter = vi.fn();
    renderSidebar({ onSelectFilter });

    fireEvent.click(screen.getByRole("button", { name: "No project" }));

    expect(onSelectFilter).toHaveBeenCalledWith({ type: "no-project" });
  });

  it("calls onSelectFilter with the project when its card is clicked", () => {
    const onSelectFilter = vi.fn();
    renderSidebar({ onSelectFilter });

    fireEvent.click(screen.getByText("Home renovation"));

    expect(onSelectFilter).toHaveBeenCalledWith({ type: "project", projectId: "proj-1" });
  });

  it("toggles the create-project form when New project is clicked", () => {
    renderSidebar();

    expect(screen.queryByLabelText("Project name")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "New project" }));

    expect(screen.getByLabelText("Project name")).toBeInTheDocument();
  });

  it("calls onCreateProject and hides the form again on submit", async () => {
    const onCreateProject = vi.fn().mockResolvedValue(undefined);
    renderSidebar({ onCreateProject });

    fireEvent.click(screen.getByRole("button", { name: "New project" }));
    fireEvent.change(screen.getByLabelText("Project name"), { target: { value: "Side project" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(onCreateProject).toHaveBeenCalledWith("Side project");
  });
});
