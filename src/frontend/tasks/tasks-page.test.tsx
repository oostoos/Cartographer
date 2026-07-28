import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as groupsApi from "../groups/groups-api";
import { GROUP_COLOR_PALETTE } from "../groups/group-color-palette";
import type { TGroup } from "../groups/types";
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
  group_id: null,
  energy_requirement: null,
  impact: null,
  due_date: null,
  time_estimate_minutes: null,
};

const GROUP: TGroup = {
  id: "group-1",
  name: "Home renovation",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  color: GROUP_COLOR_PALETTE[0],
  order: 0,
};

function buildTask(overrides: Partial<TTask>): TTask {
  return { ...TASK, ...overrides };
}

function stubGroups(groups: TGroup[] = []) {
  vi.spyOn(groupsApi, "fetchGroups").mockResolvedValue(groups);
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
    stubGroups();

    renderPage();

    expect(screen.getByRole("heading", { name: "Tasks" })).toBeInTheDocument();
  });

  it("renders an empty state when there are no tasks", async () => {
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([]);
    stubGroups();

    renderPage();

    await waitFor(() => expect(screen.getByText(/No tasks yet/)).toBeInTheDocument());
  });

  it("renders each fetched task in the list", async () => {
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([TASK]);
    stubGroups();

    renderPage();

    await waitFor(() => expect(screen.getByRole("link", { name: "Buy milk" })).toBeInTheDocument());
  });

  it("renders an error message when loading fails", async () => {
    vi.spyOn(tasksApi, "fetchTasks").mockRejectedValue(new Error("network error"));
    stubGroups();

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
    stubGroups();

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
    stubGroups();

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
    stubGroups();

    renderPage();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: 'Reorder "Active task"' })).toBeInTheDocument(),
    );
    expect(screen.queryByRole("button", { name: 'Reorder "Completed today"' })).not.toBeInTheDocument();
  });

  it("shows the empty-state message in the detail column at /tasks", async () => {
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([TASK]);
    stubGroups();

    renderPage();

    await waitFor(() => expect(screen.getByText("Select a task to see its details.")).toBeInTheDocument());
  });

  it("renders the task detail panel at /tasks/:taskId instead of the empty state", async () => {
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([TASK]);
    stubGroups();

    renderPage("/tasks/1");

    await waitFor(() => expect(screen.getByLabelText("Edit task title")).toBeInTheDocument());
    expect(screen.queryByText("Select a task to see its details.")).not.toBeInTheDocument();
  });

  it("renders a group pill for a task assigned to a group", async () => {
    const assignedTask = buildTask({ id: "1", title: "Paint fence", group_id: GROUP.id });
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([assignedTask]);
    stubGroups([GROUP]);

    renderPage();

    await waitFor(() =>
      expect(screen.getByText("Home renovation", { selector: ".task-group-pill" })).toBeInTheDocument(),
    );
  });

  it("renders the group sidebar's filter buttons and group cards", async () => {
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([]);
    stubGroups([GROUP]);

    renderPage();

    await waitFor(() =>
      expect(screen.getByText("Home renovation", { selector: ".group-card__name" })).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "All tasks" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "No group" })).toBeInTheDocument();
  });

  it("filters the visible tasks to a group when its card is clicked", async () => {
    const inGroup = buildTask({ id: "1", title: "In group", group_id: GROUP.id });
    const unassigned = buildTask({ id: "2", title: "Unassigned task" });
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([inGroup, unassigned]);
    stubGroups([GROUP]);

    renderPage();

    await waitFor(() =>
      expect(screen.getByText("Home renovation", { selector: ".group-card__name" })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText("Home renovation", { selector: ".group-card__name" }));

    await waitFor(() => expect(screen.getByRole("link", { name: "In group" })).toBeInTheDocument());
    expect(screen.queryByRole("link", { name: "Unassigned task" })).not.toBeInTheDocument();
  });

  it("filters the visible tasks to unassigned ones when No group is clicked", async () => {
    const inGroup = buildTask({ id: "1", title: "In group", group_id: GROUP.id });
    const unassigned = buildTask({ id: "2", title: "Unassigned task" });
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([inGroup, unassigned]);
    stubGroups([GROUP]);

    renderPage();
    await waitFor(() => expect(screen.getByRole("link", { name: "In group" })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "No group" }));

    await waitFor(() => expect(screen.getByRole("link", { name: "Unassigned task" })).toBeInTheDocument());
    expect(screen.queryByRole("link", { name: "In group" })).not.toBeInTheDocument();
  });

  it("creates a task assigned to the active group filter", async () => {
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([]);
    stubGroups([GROUP]);
    const createSpy = vi.spyOn(tasksApi, "createTask").mockResolvedValue(buildTask({ group_id: GROUP.id }));

    renderPage(`/tasks?group=${GROUP.id}`);
    await waitFor(() => expect(screen.getByText("Home renovation")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText("Task title"), { target: { value: "Paint fence" } });
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));

    await waitFor(() =>
      expect(createSpy).toHaveBeenCalledWith({ title: "Paint fence", description: "", group_id: GROUP.id }),
    );
  });

  it("creates an unassigned task when All tasks is the active filter", async () => {
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([]);
    stubGroups([GROUP]);
    const createSpy = vi.spyOn(tasksApi, "createTask").mockResolvedValue(TASK);

    renderPage();
    await waitFor(() => expect(screen.getByText("Home renovation")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText("Task title"), { target: { value: "Buy milk" } });
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));

    await waitFor(() =>
      expect(createSpy).toHaveBeenCalledWith({ title: "Buy milk", description: "", group_id: null }),
    );
  });

  it("renders a read-only energy pill on the row for a task with energy_requirement set", async () => {
    const withEnergy = buildTask({ id: "1", title: "Buy milk", energy_requirement: 2 });
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([withEnergy]);
    stubGroups();

    renderPage();

    await waitFor(() => expect(screen.getByText("Energy")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /^Energy: level/ })).not.toBeInTheDocument();
  });

  it("deletes a task via its row's delete button without a confirmation prompt", async () => {
    const confirmSpy = vi.spyOn(window, "confirm");
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([TASK]);
    stubGroups();
    const deleteSpy = vi.spyOn(tasksApi, "deleteTask").mockResolvedValue({ id: TASK.id });

    renderPage();
    await waitFor(() => expect(screen.getByRole("link", { name: "Buy milk" })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: 'Delete "Buy milk"' }));

    await waitFor(() => expect(deleteSpy).toHaveBeenCalledWith(TASK.id));
    expect(confirmSpy).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("link", { name: "Buy milk" })).not.toBeInTheDocument());
  });
});
