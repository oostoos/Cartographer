import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as tasksApi from "./tasks-api";
import { TaskDetailPanel } from "./task-detail-panel";
import type { ITasksOutletContext } from "./tasks-outlet-context";
import type { TTask } from "./types";

const TASK: TTask = {
  id: "abc123",
  title: "Buy milk",
  description: "2%",
  completed: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  completed_at: null,
  order: 0,
  project_id: null,
};

function renderAtTaskId(taskId: string, context: ITasksOutletContext) {
  return render(
    <MemoryRouter initialEntries={[`/tasks/${taskId}`]}>
      <Routes>
        <Route path="/tasks" element={<Outlet context={context} />}>
          <Route path=":taskId" element={<TaskDetailPanel />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("TaskDetailPanel", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders from the outlet context without fetching when the task is already loaded", async () => {
    const fetchSpy = vi.spyOn(tasksApi, "fetchTask");

    renderAtTaskId(TASK.id, { tasks: [TASK], onTaskUpdated: vi.fn() });

    await waitFor(() => expect(screen.getByText("Buy milk")).toBeInTheDocument());
    expect(screen.getByText("2%")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("falls back to fetchTask when the task isn't in the outlet context", async () => {
    vi.spyOn(tasksApi, "fetchTask").mockResolvedValue(TASK);

    renderAtTaskId(TASK.id, { tasks: [], onTaskUpdated: vi.fn() });

    expect(screen.getByText(/Loading task/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Buy milk")).toBeInTheDocument());
  });

  it("shows an error message when the fallback fetch fails", async () => {
    vi.spyOn(tasksApi, "fetchTask").mockRejectedValue(new Error("404"));

    renderAtTaskId("does-not-exist", { tasks: [], onTaskUpdated: vi.fn() });

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Task not found."));
  });

  it("shows a fallback message when the task has no description", async () => {
    renderAtTaskId(TASK.id, { tasks: [{ ...TASK, description: "" }], onTaskUpdated: vi.fn() });

    await waitFor(() => expect(screen.getByText("No description")).toBeInTheDocument());
  });

  it("toggling completion calls onTaskUpdated with the updated task", async () => {
    vi.spyOn(tasksApi, "setTaskCompleted").mockResolvedValue({ ...TASK, completed: true });
    const onTaskUpdated = vi.fn();

    renderAtTaskId(TASK.id, { tasks: [TASK], onTaskUpdated });
    await waitFor(() => expect(screen.getByText("Buy milk")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("checkbox"));

    await waitFor(() => expect(onTaskUpdated).toHaveBeenCalledWith({ ...TASK, completed: true }));
  });

  it("edits and saves the title and description, calling onTaskUpdated", async () => {
    const updateSpy = vi
      .spyOn(tasksApi, "updateTask")
      .mockResolvedValue({ ...TASK, title: "Buy oat milk", description: "unsweetened" });
    const onTaskUpdated = vi.fn();

    renderAtTaskId(TASK.id, { tasks: [TASK], onTaskUpdated });
    await waitFor(() => expect(screen.getByText("Buy milk")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Task title"), { target: { value: "Buy oat milk" } });
    fireEvent.change(screen.getByLabelText("Task description"), {
      target: { value: "unsweetened" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(updateSpy).toHaveBeenCalledWith(TASK.id, {
        title: "Buy oat milk",
        description: "unsweetened",
      }),
    );
    await waitFor(() => expect(screen.getByText("Buy oat milk")).toBeInTheDocument());
    expect(onTaskUpdated).toHaveBeenCalledWith({
      ...TASK,
      title: "Buy oat milk",
      description: "unsweetened",
    });
  });

  it("save is disabled and does nothing when the edited title is blank", async () => {
    const updateSpy = vi.spyOn(tasksApi, "updateTask");

    renderAtTaskId(TASK.id, { tasks: [TASK], onTaskUpdated: vi.fn() });
    await waitFor(() => expect(screen.getByText("Buy milk")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Task title"), { target: { value: "   " } });

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it("cancel discards edits without saving", async () => {
    const updateSpy = vi.spyOn(tasksApi, "updateTask");

    renderAtTaskId(TASK.id, { tasks: [TASK], onTaskUpdated: vi.fn() });
    await waitFor(() => expect(screen.getByText("Buy milk")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Task title"), { target: { value: "Should not save" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(updateSpy).not.toHaveBeenCalled();
    expect(screen.getByText("Buy milk")).toBeInTheDocument();
  });
});
