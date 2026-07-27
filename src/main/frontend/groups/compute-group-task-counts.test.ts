import { describe, expect, it } from "vitest";

import type { TTask } from "../tasks/types";
import { computeGroupTaskCounts } from "./compute-group-task-counts";

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

describe("computeGroupTaskCounts", () => {
  it("returns zero/zero when no tasks belong to the group", () => {
    expect(computeGroupTaskCounts([], "group-1")).toEqual({ completed: 0, total: 0 });
  });

  it("counts only tasks belonging to the given group", () => {
    const tasks = [
      buildTask({ id: "1", group_id: "group-1" }),
      buildTask({ id: "2", group_id: "group-2" }),
      buildTask({ id: "3", group_id: null }),
    ];

    expect(computeGroupTaskCounts(tasks, "group-1")).toEqual({ completed: 0, total: 1 });
  });

  it("counts how many of the group's tasks are completed", () => {
    const tasks = [
      buildTask({ id: "1", group_id: "group-1", completed: true }),
      buildTask({ id: "2", group_id: "group-1", completed: false }),
      buildTask({ id: "3", group_id: "group-1", completed: true }),
    ];

    expect(computeGroupTaskCounts(tasks, "group-1")).toEqual({ completed: 2, total: 3 });
  });
});
