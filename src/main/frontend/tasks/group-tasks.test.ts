import { describe, expect, it } from "vitest";

import { groupTasks } from "./group-tasks";
import type { TTask } from "./types";

const NOW = new Date(2026, 6, 25, 12, 0);

function buildTask(overrides: Partial<TTask>): TTask {
  return {
    id: "task-1",
    title: "Task",
    description: "",
    completed: false,
    created_at: NOW.toISOString(),
    updated_at: NOW.toISOString(),
    completed_at: null,
    order: 0,
    project_id: null,
    ...overrides,
  };
}

describe("groupTasks", () => {
  it("returns empty buckets for an empty list", () => {
    expect(groupTasks([], NOW)).toEqual({ active: [], completedToday: [], completedPrior: [] });
  });

  it("buckets every task as active when none are completed", () => {
    const tasks = [buildTask({ id: "a" }), buildTask({ id: "b" })];

    const grouped = groupTasks(tasks, NOW);

    expect(grouped.active.map((t) => t.id)).toEqual(["a", "b"]);
    expect(grouped.completedToday).toEqual([]);
    expect(grouped.completedPrior).toEqual([]);
  });

  it("buckets tasks completed earlier today as completedToday", () => {
    const task = buildTask({
      id: "a",
      completed: true,
      completed_at: new Date(2026, 6, 25, 8, 0).toISOString(),
    });

    const grouped = groupTasks([task], NOW);

    expect(grouped.completedToday.map((t) => t.id)).toEqual(["a"]);
    expect(grouped.active).toEqual([]);
    expect(grouped.completedPrior).toEqual([]);
  });

  it("buckets tasks completed on a prior day as completedPrior", () => {
    const task = buildTask({
      id: "a",
      completed: true,
      completed_at: new Date(2026, 6, 20, 8, 0).toISOString(),
    });

    const grouped = groupTasks([task], NOW);

    expect(grouped.completedPrior.map((t) => t.id)).toEqual(["a"]);
    expect(grouped.active).toEqual([]);
    expect(grouped.completedToday).toEqual([]);
  });

  it("buckets a completed task with a null completed_at (legacy record) as completedPrior", () => {
    const task = buildTask({ id: "a", completed: true, completed_at: null });

    const grouped = groupTasks([task], NOW);

    expect(grouped.completedPrior.map((t) => t.id)).toEqual(["a"]);
    expect(grouped.completedToday).toEqual([]);
  });

  it("splits a mixed list into all three buckets", () => {
    const activeTask = buildTask({ id: "active" });
    const todayTask = buildTask({
      id: "today",
      completed: true,
      completed_at: new Date(2026, 6, 25, 8, 0).toISOString(),
    });
    const priorTask = buildTask({
      id: "prior",
      completed: true,
      completed_at: new Date(2026, 6, 20, 8, 0).toISOString(),
    });

    const grouped = groupTasks([activeTask, todayTask, priorTask], NOW);

    expect(grouped.active.map((t) => t.id)).toEqual(["active"]);
    expect(grouped.completedToday.map((t) => t.id)).toEqual(["today"]);
    expect(grouped.completedPrior.map((t) => t.id)).toEqual(["prior"]);
  });

  it("sorts completedToday and completedPrior with the most recently completed first", () => {
    const earlier = buildTask({
      id: "earlier",
      completed: true,
      completed_at: new Date(2026, 6, 25, 8, 0).toISOString(),
    });
    const later = buildTask({
      id: "later",
      completed: true,
      completed_at: new Date(2026, 6, 25, 10, 0).toISOString(),
    });

    const grouped = groupTasks([earlier, later], NOW);

    expect(grouped.completedToday.map((t) => t.id)).toEqual(["later", "earlier"]);
  });
});
