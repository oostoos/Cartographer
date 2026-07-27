import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as projectsApi from "../projects/projects-api";
import type { TProject } from "../projects/types";
import * as tasksApi from "./tasks-api";
import { TaskDetailPanel } from "./task-detail-panel";
import { TasksPage } from "./tasks-page";
import type { TTask } from "./types";

const TASK: TTask = {
  id: "1",
  title: "Buy milk",
  description: "",
  completed: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  completed_at: null,
  order: 0,
  project_id: null,
};

const PROJECT: TProject = {
  id: "proj-1",
  name: "Home renovation",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  order: 0,
};

function buildTask(overrides: Partial<TTask>): TTask {
  return { ...TASK, ...overrides };
}

function stubProjects(projects: TProject[] = []) {
  vi.spyOn(projectsApi, "fetchProjects").mockResolvedValue(projects);
}

function renderPage(initialPath = "/tasks") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/tasks" element={<TasksPage />}>
          <Route path=":taskId" element={<TaskDetailPanel />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("TasksPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the Tasks heading immediately", () => {
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([]);
    stubProjects();

    renderPage();

    expect(screen.getByRole("heading", { name: "Tasks" })).toBeInTheDocument();
  });

  it("renders an empty state when there are no tasks", async () => {
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([]);
    stubProjects();

    renderPage();

    await waitFor(() => expect(screen.getByText(/No tasks yet/)).toBeInTheDocument());
  });

  it("renders each fetched task in the list", async () => {
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([TASK]);
    stubProjects();

    renderPage();

    await waitFor(() => expect(screen.getByRole("link", { name: "Buy milk" })).toBeInTheDocument());
  });

  it("renders an error message when loading fails", async () => {
    vi.spyOn(tasksApi, "fetchTasks").mockRejectedValue(new Error("network error"));
    stubProjects();

    renderPage();

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  });

  it("shows an active task and a task completed today in the visible list, in that order", async () => {
    const activeTask = buildTask({ id: "active", title: "Active task" });
    const todayTask = buildTask({
      id: "today",
      title: "Completed today",
      completed: true,
      completed_at: new Date().toISOString(),
    });
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([todayTask, activeTask]);
    stubProjects();

    renderPage();

    await waitFor(() => expect(screen.getByRole("link", { name: "Active task" })).toBeInTheDocument());
    const links = screen.getAllByRole("link").map((link) => link.textContent);
    expect(links).toEqual(["Active task", "Completed today"]);
  });

  it("hides a task completed on a prior day from the visible list, showing it only in the collapsed Completed section", async () => {
    const priorTask = buildTask({
      id: "prior",
      title: "Completed earlier",
      completed: true,
      completed_at: "2020-01-01T00:00:00Z",
    });
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([priorTask]);
    stubProjects();

    renderPage();

    await waitFor(() => expect(screen.getByRole("button", { name: /Completed \(1\)/ })).toBeInTheDocument());
    expect(screen.queryByRole("link", { name: "Completed earlier" })).not.toBeInTheDocument();
  });

  it("renders a drag handle for an active task but not for a task completed today", async () => {
    const activeTask = buildTask({ id: "active", title: "Active task" });
    const todayTask = buildTask({
      id: "today",
      title: "Completed today",
      completed: true,
      completed_at: new Date().toISOString(),
    });
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([activeTask, todayTask]);
    stubProjects();

    renderPage();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: 'Reorder "Active task"' })).toBeInTheDocument(),
    );
    expect(screen.queryByRole("button", { name: 'Reorder "Completed today"' })).not.toBeInTheDocument();
  });

  it("shows the empty-state message in the detail column at /tasks", async () => {
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([TASK]);
    stubProjects();

    renderPage();

    await waitFor(() => expect(screen.getByText("Select a task to see its details.")).toBeInTheDocument());
  });

  it("renders the task detail panel at /tasks/:taskId instead of the empty state", async () => {
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([TASK]);
    stubProjects();

    renderPage("/tasks/1");

    await waitFor(() => expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument());
    expect(screen.queryByText("Select a task to see its details.")).not.toBeInTheDocument();
  });

  it("renders a project pill for a task assigned to a project", async () => {
    const assignedTask = buildTask({ id: "1", title: "Paint fence", project_id: PROJECT.id });
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([assignedTask]);
    stubProjects([PROJECT]);

    renderPage();

    await waitFor(() =>
      expect(screen.getByText("Home renovation", { selector: ".task-project-pill" })).toBeInTheDocument(),
    );
  });

  it("renders the project sidebar's filter buttons and project cards", async () => {
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([]);
    stubProjects([PROJECT]);

    renderPage();

    await waitFor(() =>
      expect(screen.getByText("Home renovation", { selector: ".project-card__name" })).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "All tasks" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "No project" })).toBeInTheDocument();
  });

  it("filters the visible tasks to a project when its card is clicked", async () => {
    const inProject = buildTask({ id: "1", title: "In project", project_id: PROJECT.id });
    const unassigned = buildTask({ id: "2", title: "Unassigned task" });
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([inProject, unassigned]);
    stubProjects([PROJECT]);

    renderPage();

    await waitFor(() =>
      expect(screen.getByText("Home renovation", { selector: ".project-card__name" })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText("Home renovation", { selector: ".project-card__name" }));

    await waitFor(() => expect(screen.getByRole("link", { name: "In project" })).toBeInTheDocument());
    expect(screen.queryByRole("link", { name: "Unassigned task" })).not.toBeInTheDocument();
  });

  it("filters the visible tasks to unassigned ones when No project is clicked", async () => {
    const inProject = buildTask({ id: "1", title: "In project", project_id: PROJECT.id });
    const unassigned = buildTask({ id: "2", title: "Unassigned task" });
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([inProject, unassigned]);
    stubProjects([PROJECT]);

    renderPage();
    await waitFor(() => expect(screen.getByRole("link", { name: "In project" })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "No project" }));

    await waitFor(() => expect(screen.getByRole("link", { name: "Unassigned task" })).toBeInTheDocument());
    expect(screen.queryByRole("link", { name: "In project" })).not.toBeInTheDocument();
  });

  it("creates a task assigned to the active project filter", async () => {
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([]);
    stubProjects([PROJECT]);
    const createSpy = vi.spyOn(tasksApi, "createTask").mockResolvedValue(buildTask({ project_id: PROJECT.id }));

    renderPage(`/tasks?project=${PROJECT.id}`);
    await waitFor(() => expect(screen.getByText("Home renovation")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText("Task title"), { target: { value: "Paint fence" } });
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));

    await waitFor(() =>
      expect(createSpy).toHaveBeenCalledWith({ title: "Paint fence", description: "", project_id: PROJECT.id }),
    );
  });

  it("creates an unassigned task when All tasks is the active filter", async () => {
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([]);
    stubProjects([PROJECT]);
    const createSpy = vi.spyOn(tasksApi, "createTask").mockResolvedValue(TASK);

    renderPage();
    await waitFor(() => expect(screen.getByText("Home renovation")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText("Task title"), { target: { value: "Buy milk" } });
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));

    await waitFor(() =>
      expect(createSpy).toHaveBeenCalledWith({ title: "Buy milk", description: "", project_id: null }),
    );
  });
});
