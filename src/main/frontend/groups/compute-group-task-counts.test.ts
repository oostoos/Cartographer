import { describe, expect, it } from "vitest";

import type { TTask } from "../tasks/types";
import { computeProjectTaskCounts } from "./compute-project-task-counts";

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

describe("computeProjectTaskCounts", () => {
  it("returns zero/zero when no tasks belong to the project", () => {
    expect(computeProjectTaskCounts([], "proj-1")).toEqual({ completed: 0, total: 0 });
  });

  it("counts only tasks belonging to the given project", () => {
    const tasks = [
      buildTask({ id: "1", project_id: "proj-1" }),
      buildTask({ id: "2", project_id: "proj-2" }),
      buildTask({ id: "3", project_id: null }),
    ];

    expect(computeProjectTaskCounts(tasks, "proj-1")).toEqual({ completed: 0, total: 1 });
  });

  it("counts how many of the project's tasks are completed", () => {
    const tasks = [
      buildTask({ id: "1", project_id: "proj-1", completed: true }),
      buildTask({ id: "2", project_id: "proj-1", completed: false }),
      buildTask({ id: "3", project_id: "proj-1", completed: true }),
    ];

    expect(computeProjectTaskCounts(tasks, "proj-1")).toEqual({ completed: 2, total: 3 });
  });
});
