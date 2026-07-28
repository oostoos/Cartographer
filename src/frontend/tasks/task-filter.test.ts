import { describe, expect, it } from "vitest";

import { buildTaskFilterParam, filterTasksByGroup, parseTaskFilter } from "./task-filter";
import type { TTask } from "./types";

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
    energy_requirement: null,
    impact: null,
    due_date: null,
    time_estimate_minutes: null,
    ...overrides,
  };
}

describe("parseTaskFilter", () => {
  it("returns 'all' when the group param is absent", () => {
    expect(parseTaskFilter(new URLSearchParams())).toEqual({ type: "all" });
  });

  it("returns 'no-group' when the group param is 'none'", () => {
    expect(parseTaskFilter(new URLSearchParams("group=none"))).toEqual({ type: "no-group" });
  });

  it("returns a group filter for any other group param value", () => {
    expect(parseTaskFilter(new URLSearchParams("group=group-1"))).toEqual({
      type: "group",
      groupId: "group-1",
    });
  });
});

describe("buildTaskFilterParam", () => {
  it("returns undefined for 'all'", () => {
    expect(buildTaskFilterParam({ type: "all" })).toBeUndefined();
  });

  it("returns 'none' for 'no-group'", () => {
    expect(buildTaskFilterParam({ type: "no-group" })).toBe("none");
  });

  it("returns the group id for a group filter", () => {
    expect(buildTaskFilterParam({ type: "group", groupId: "group-1" })).toBe("group-1");
  });

  it("round-trips through parseTaskFilter", () => {
    const filter = { type: "group" as const, groupId: "group-1" };
    const param = buildTaskFilterParam(filter);
    expect(parseTaskFilter(new URLSearchParams({ group: param! }))).toEqual(filter);
  });
});

describe("filterTasksByGroup", () => {
  const groupTask = buildTask({ id: "1", group_id: "group-1" });
  const otherGroupTask = buildTask({ id: "2", group_id: "group-2" });
  const unassignedTask = buildTask({ id: "3", group_id: null });
  const tasks = [groupTask, otherGroupTask, unassignedTask];

  it("returns every task for 'all'", () => {
    expect(filterTasksByGroup(tasks, { type: "all" })).toEqual(tasks);
  });

  it("returns only unassigned tasks for 'no-group'", () => {
    expect(filterTasksByGroup(tasks, { type: "no-group" })).toEqual([unassignedTask]);
  });

  it("returns only tasks in the given group for a group filter", () => {
    expect(filterTasksByGroup(tasks, { type: "group", groupId: "group-1" })).toEqual([groupTask]);
  });
});
