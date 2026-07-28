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
  group_id: null,
  energy_requirement: null,
  impact: null,
  due_date: null,
  time_estimate_minutes: null,
};

function renderAtTaskId(taskId: string, context: ITasksOutletContext, initialPath = `/tasks/${taskId}`) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
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

    await waitFor(() => expect(screen.getByLabelText("Edit task title")).toHaveValue("Buy milk"));
    expect(screen.getByLabelText("Edit task description")).toHaveValue("2%");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("falls back to fetchTask when the task isn't in the outlet context", async () => {
    vi.spyOn(tasksApi, "fetchTask").mockResolvedValue(TASK);

    renderAtTaskId(TASK.id, { tasks: [], onTaskUpdated: vi.fn() });

    expect(screen.getByText(/Loading task/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText("Edit task title")).toHaveValue("Buy milk"));
  });

  it("shows an error message when the fallback fetch fails", async () => {
    vi.spyOn(tasksApi, "fetchTask").mockRejectedValue(new Error("404"));

    renderAtTaskId("does-not-exist", { tasks: [], onTaskUpdated: vi.fn() });

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Task not found."));
  });

  it("renders no Edit, Save, Cancel, or Delete buttons — every field is always live", async () => {
    renderAtTaskId(TASK.id, { tasks: [TASK], onTaskUpdated: vi.fn() });

    await waitFor(() => expect(screen.getByLabelText("Edit task title")).toHaveValue("Buy milk"));
    for (const name of ["Edit", "Save", "Cancel", "Delete"]) {
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    }
  });

  it("commits the title on blur when it changed", async () => {
    const updateSpy = vi.spyOn(tasksApi, "updateTask").mockResolvedValue({ ...TASK, title: "Buy oat milk" });
    const onTaskUpdated = vi.fn();

    renderAtTaskId(TASK.id, { tasks: [TASK], onTaskUpdated });
    await waitFor(() => expect(screen.getByLabelText("Edit task title")).toHaveValue("Buy milk"));

    const titleInput = screen.getByLabelText("Edit task title");
    fireEvent.change(titleInput, { target: { value: "Buy oat milk" } });
    fireEvent.blur(titleInput);

    await waitFor(() => expect(updateSpy).toHaveBeenCalledWith(TASK.id, { title: "Buy oat milk" }));
    expect(onTaskUpdated).toHaveBeenCalledWith({ ...TASK, title: "Buy oat milk" });
  });

  it("does not commit the title on blur when it did not change", async () => {
    const updateSpy = vi.spyOn(tasksApi, "updateTask");

    renderAtTaskId(TASK.id, { tasks: [TASK], onTaskUpdated: vi.fn() });
    await waitFor(() => expect(screen.getByLabelText("Edit task title")).toHaveValue("Buy milk"));

    fireEvent.blur(screen.getByLabelText("Edit task title"));

    expect(updateSpy).not.toHaveBeenCalled();
  });

  it("reverts to the last saved title on blur instead of saving a blank one", async () => {
    const updateSpy = vi.spyOn(tasksApi, "updateTask");

    renderAtTaskId(TASK.id, { tasks: [TASK], onTaskUpdated: vi.fn() });
    await waitFor(() => expect(screen.getByLabelText("Edit task title")).toHaveValue("Buy milk"));

    const titleInput = screen.getByLabelText("Edit task title");
    fireEvent.change(titleInput, { target: { value: "   " } });
    fireEvent.blur(titleInput);

    expect(updateSpy).not.toHaveBeenCalled();
    expect(titleInput).toHaveValue("Buy milk");
  });

  it("commits the description on blur when it changed", async () => {
    const updateSpy = vi
      .spyOn(tasksApi, "updateTask")
      .mockResolvedValue({ ...TASK, description: "unsweetened" });
    const onTaskUpdated = vi.fn();

    renderAtTaskId(TASK.id, { tasks: [TASK], onTaskUpdated });
    await waitFor(() => expect(screen.getByLabelText("Edit task title")).toHaveValue("Buy milk"));

    const descriptionInput = screen.getByLabelText("Edit task description");
    fireEvent.change(descriptionInput, { target: { value: "unsweetened" } });
    fireEvent.blur(descriptionInput);

    await waitFor(() => expect(updateSpy).toHaveBeenCalledWith(TASK.id, { description: "unsweetened" }));
    expect(onTaskUpdated).toHaveBeenCalledWith({ ...TASK, description: "unsweetened" });
  });

  it("commits energy requirement immediately on click", async () => {
    const energySpy = vi
      .spyOn(tasksApi, "setTaskEnergyRequirement")
      .mockResolvedValue({ ...TASK, energy_requirement: 3 });
    const onTaskUpdated = vi.fn();

    renderAtTaskId(TASK.id, { tasks: [TASK], onTaskUpdated });
    await waitFor(() => expect(screen.getByLabelText("Edit task title")).toHaveValue("Buy milk"));

    fireEvent.click(screen.getAllByRole("button", { name: /^Energy requirement: level/ })[2]);

    await waitFor(() => expect(energySpy).toHaveBeenCalledWith(TASK.id, 3));
    expect(onTaskUpdated).toHaveBeenCalledWith({ ...TASK, energy_requirement: 3 });
  });

  it("commits impact immediately on click", async () => {
    const impactSpy = vi.spyOn(tasksApi, "setTaskImpact").mockResolvedValue({ ...TASK, impact: 5 });

    renderAtTaskId(TASK.id, { tasks: [TASK], onTaskUpdated: vi.fn() });
    await waitFor(() => expect(screen.getByLabelText("Edit task title")).toHaveValue("Buy milk"));

    fireEvent.click(screen.getAllByRole("button", { name: /^Impact: level/ })[4]);

    await waitFor(() => expect(impactSpy).toHaveBeenCalledWith(TASK.id, 5));
  });

  it("commits due date immediately on change", async () => {
    const dueDateSpy = vi
      .spyOn(tasksApi, "setTaskDueDate")
      .mockResolvedValue({ ...TASK, due_date: "2026-08-01" });

    renderAtTaskId(TASK.id, { tasks: [TASK], onTaskUpdated: vi.fn() });
    await waitFor(() => expect(screen.getByLabelText("Edit task title")).toHaveValue("Buy milk"));

    fireEvent.change(screen.getByLabelText("Due date"), { target: { value: "2026-08-01" } });

    await waitFor(() => expect(dueDateSpy).toHaveBeenCalledWith(TASK.id, "2026-08-01"));
  });

  it("commits time estimate immediately on interaction", async () => {
    const estimateSpy = vi
      .spyOn(tasksApi, "setTaskTimeEstimateMinutes")
      .mockResolvedValue({ ...TASK, time_estimate_minutes: 15 });

    renderAtTaskId(TASK.id, { tasks: [TASK], onTaskUpdated: vi.fn() });
    await waitFor(() => expect(screen.getByLabelText("Edit task title")).toHaveValue("Buy milk"));

    fireEvent.click(screen.getByRole("button", { name: "Increase Time estimate" }));

    await waitFor(() => expect(estimateSpy).toHaveBeenCalledWith(TASK.id, 15));
  });
});
