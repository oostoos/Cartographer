import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as tasksApi from "./tasks-api";
import { useTasks } from "./use-tasks";
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

describe("useTasks", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads tasks on mount", async () => {
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([TASK]);

    const { result } = renderHook(() => useTasks());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tasks).toEqual([TASK]);
    expect(result.current.error).toBeNull();
  });

  it("sets an error message when loading tasks fails", async () => {
    vi.spyOn(tasksApi, "fetchTasks").mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useTasks());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe("Failed to load tasks.");
    expect(result.current.tasks).toEqual([]);
  });

  it("createTask appends the newly created task to state", async () => {
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([]);
    vi.spyOn(tasksApi, "createTask").mockResolvedValue(TASK);

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createTask("Buy milk", "");
    });

    expect(result.current.tasks).toEqual([TASK]);
  });

  it("toggleTaskCompleted replaces the task with the updated version", async () => {
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([TASK]);
    vi.spyOn(tasksApi, "setTaskCompleted").mockResolvedValue({ ...TASK, completed: true });

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.toggleTaskCompleted(TASK.id, true);
    });

    expect(result.current.tasks[0].completed).toBe(true);
  });

  it("applyTaskUpdate replaces a matching task in state", async () => {
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([TASK]);

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.applyTaskUpdate({ ...TASK, title: "Buy oat milk" });
    });

    expect(result.current.tasks[0].title).toBe("Buy oat milk");
  });

  it("applyTaskUpdate is a no-op for an unknown task id", async () => {
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([TASK]);

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.applyTaskUpdate({ ...TASK, id: "unknown", title: "Ghost task" });
    });

    expect(result.current.tasks).toEqual([TASK]);
  });
});
