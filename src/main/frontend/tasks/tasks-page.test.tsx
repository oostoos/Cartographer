import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

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
};

function buildTask(overrides: Partial<TTask>): TTask {
  return { ...TASK, ...overrides };
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

    renderPage();

    expect(screen.getByRole("heading", { name: "Tasks" })).toBeInTheDocument();
  });

  it("renders an empty state when there are no tasks", async () => {
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([]);

    renderPage();

    await waitFor(() => expect(screen.getByText(/No tasks yet/)).toBeInTheDocument());
  });

  it("renders each fetched task in the list", async () => {
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([TASK]);

    renderPage();

    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Buy milk" })).toBeInTheDocument(),
    );
  });

  it("renders an error message when loading fails", async () => {
    vi.spyOn(tasksApi, "fetchTasks").mockRejectedValue(new Error("network error"));

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

    renderPage();

    await waitFor(() => expect(screen.getByRole("button", { name: /Completed \(1\)/ })).toBeInTheDocument());
    expect(screen.queryByRole("link", { name: "Completed earlier" })).not.toBeInTheDocument();
  });

  it("does not apply the detail-open layout at /tasks", async () => {
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([TASK]);

    const { container } = renderPage();

    await waitFor(() => expect(screen.getByRole("link", { name: "Buy milk" })).toBeInTheDocument());
    expect(container.querySelector(".tasks-layout--detail-open")).toBeNull();
  });

  it("applies the detail-open layout and renders the panel at /tasks/:taskId", async () => {
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([TASK]);

    const { container } = renderPage("/tasks/1");

    await waitFor(() => expect(container.querySelector(".tasks-layout--detail-open")).not.toBeNull());
    expect(screen.getByRole("button", { name: "Close task detail" })).toBeInTheDocument();
  });
});
