import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as tasksApi from "./tasks-api";
import { TaskDetailPage } from "./task-detail-page";
import type { TTask } from "./types";

const TASK: TTask = {
  id: "abc123",
  title: "Buy milk",
  description: "2%",
  completed: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

function renderAtTaskId(taskId: string) {
  return render(
    <MemoryRouter initialEntries={[`/tasks/${taskId}`]}>
      <Routes>
        <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("TaskDetailPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a loading state, then the task's title and description", async () => {
    vi.spyOn(tasksApi, "fetchTask").mockResolvedValue(TASK);

    renderAtTaskId(TASK.id);

    expect(screen.getByText(/Loading task/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Buy milk")).toBeInTheDocument());
    expect(screen.getByText("2%")).toBeInTheDocument();
  });

  it("shows a fallback message when the task has no description", async () => {
    vi.spyOn(tasksApi, "fetchTask").mockResolvedValue({ ...TASK, description: "" });

    renderAtTaskId(TASK.id);

    await waitFor(() => expect(screen.getByText("No description")).toBeInTheDocument());
  });

  it("shows an error message when the task fails to load", async () => {
    vi.spyOn(tasksApi, "fetchTask").mockRejectedValue(new Error("404"));

    renderAtTaskId("does-not-exist");

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Task not found."));
  });

  it("toggles the completed checkbox", async () => {
    vi.spyOn(tasksApi, "fetchTask").mockResolvedValue(TASK);
    vi.spyOn(tasksApi, "setTaskCompleted").mockResolvedValue({ ...TASK, completed: true });

    renderAtTaskId(TASK.id);
    await waitFor(() => expect(screen.getByText("Buy milk")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("checkbox"));

    await waitFor(() => expect(screen.getByRole("checkbox")).toBeChecked());
  });

  it("edits and saves the title and description", async () => {
    vi.spyOn(tasksApi, "fetchTask").mockResolvedValue(TASK);
    const updateSpy = vi
      .spyOn(tasksApi, "updateTask")
      .mockResolvedValue({ ...TASK, title: "Buy oat milk", description: "unsweetened" });

    renderAtTaskId(TASK.id);
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
  });

  it("save is disabled and does nothing when the edited title is blank", async () => {
    vi.spyOn(tasksApi, "fetchTask").mockResolvedValue(TASK);
    const updateSpy = vi.spyOn(tasksApi, "updateTask");

    renderAtTaskId(TASK.id);
    await waitFor(() => expect(screen.getByText("Buy milk")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Task title"), { target: { value: "   " } });

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it("cancel discards edits without saving", async () => {
    vi.spyOn(tasksApi, "fetchTask").mockResolvedValue(TASK);
    const updateSpy = vi.spyOn(tasksApi, "updateTask");

    renderAtTaskId(TASK.id);
    await waitFor(() => expect(screen.getByText("Buy milk")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Task title"), { target: { value: "Should not save" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(updateSpy).not.toHaveBeenCalled();
    expect(screen.getByText("Buy milk")).toBeInTheDocument();
  });
});
