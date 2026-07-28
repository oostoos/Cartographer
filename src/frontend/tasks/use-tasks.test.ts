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
  order: 0,
  group_id: null,
  energy_requirement: null,
  impact: null,
  due_date: null,
  time_estimate_minutes: null,
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

  it("createTask passes the given group id through to the request", async () => {
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([]);
    const createSpy = vi.spyOn(tasksApi, "createTask").mockResolvedValue({ ...TASK, group_id: "group-1" });

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createTask("Buy milk", "", "group-1");
    });

    expect(createSpy).toHaveBeenCalledWith({ title: "Buy milk", description: "", group_id: "group-1" });
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

  it("reorderActiveTasks immediately reflects the given order, then syncs to the server response", async () => {
    const first = { ...TASK, id: "1", order: 0 };
    const second = { ...TASK, id: "2", order: 1 };
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([first, second]);
    const reorderSpy = vi
      .spyOn(tasksApi, "reorderTasks")
      .mockResolvedValue([{ ...second, order: 0 }, { ...first, order: 1 }]);

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.reorderActiveTasks(["2", "1"]);
    });

    expect(reorderSpy).toHaveBeenCalledWith(["2", "1"]);
    expect(result.current.tasks.map((task) => task.id)).toEqual(["2", "1"]);
  });

  it("reorderActiveTasks leaves completed tasks in place, ordered after the reordered active ones", async () => {
    const active1 = { ...TASK, id: "active-1", completed: false };
    const active2 = { ...TASK, id: "active-2", completed: false };
    const completed = { ...TASK, id: "completed-1", completed: true, completed_at: "2026-01-01T00:00:00Z" };
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([active1, active2, completed]);
    vi.spyOn(tasksApi, "reorderTasks").mockResolvedValue([active2, active1, completed]);

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.reorderActiveTasks(["active-2", "active-1"]);
    });

    expect(result.current.tasks.map((task) => task.id)).toEqual(["active-2", "active-1", "completed-1"]);
  });

  it("assignTaskGroup replaces the task with the updated (assigned) version", async () => {
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([TASK]);
    vi.spyOn(tasksApi, "setTaskGroup").mockResolvedValue({ ...TASK, group_id: "group-1" });

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.assignTaskGroup(TASK.id, "group-1");
    });

    expect(result.current.tasks[0].group_id).toBe("group-1");
  });

  it("unassignTasksFromGroup clears group_id on matching tasks only, without a network call", async () => {
    const inGroup = { ...TASK, id: "1", group_id: "group-1" };
    const otherGroup = { ...TASK, id: "2", group_id: "group-2" };
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([inGroup, otherGroup]);

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.unassignTasksFromGroup("group-1");
    });

    expect(result.current.tasks.find((task) => task.id === "1")?.group_id).toBeNull();
    expect(result.current.tasks.find((task) => task.id === "2")?.group_id).toBe("group-2");
  });

  it("deleteTask removes the task from state after the request resolves", async () => {
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([TASK]);
    const deleteSpy = vi.spyOn(tasksApi, "deleteTask").mockResolvedValue({ id: TASK.id });

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.deleteTask(TASK.id);
    });

    expect(deleteSpy).toHaveBeenCalledWith(TASK.id);
    expect(result.current.tasks).toEqual([]);
  });
});
