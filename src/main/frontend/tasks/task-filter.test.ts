import { describe, expect, it } from "vitest";

import { buildTaskFilterParam, filterTasksByProject, parseTaskFilter } from "./task-filter";
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
    project_id: null,
    ...overrides,
  };
}

describe("parseTaskFilter", () => {
  it("returns 'all' when the project param is absent", () => {
    expect(parseTaskFilter(new URLSearchParams())).toEqual({ type: "all" });
  });

  it("returns 'no-project' when the project param is 'none'", () => {
    expect(parseTaskFilter(new URLSearchParams("project=none"))).toEqual({ type: "no-project" });
  });

  it("returns a project filter for any other project param value", () => {
    expect(parseTaskFilter(new URLSearchParams("project=proj-1"))).toEqual({
      type: "project",
      projectId: "proj-1",
    });
  });
});

describe("buildTaskFilterParam", () => {
  it("returns undefined for 'all'", () => {
    expect(buildTaskFilterParam({ type: "all" })).toBeUndefined();
  });

  it("returns 'none' for 'no-project'", () => {
    expect(buildTaskFilterParam({ type: "no-project" })).toBe("none");
  });

  it("returns the project id for a project filter", () => {
    expect(buildTaskFilterParam({ type: "project", projectId: "proj-1" })).toBe("proj-1");
  });

  it("round-trips through parseTaskFilter", () => {
    const filter = { type: "project" as const, projectId: "proj-1" };
    const param = buildTaskFilterParam(filter);
    expect(parseTaskFilter(new URLSearchParams({ project: param! }))).toEqual(filter);
  });
});

describe("filterTasksByProject", () => {
  const projectTask = buildTask({ id: "1", project_id: "proj-1" });
  const otherProjectTask = buildTask({ id: "2", project_id: "proj-2" });
  const unassignedTask = buildTask({ id: "3", project_id: null });
  const tasks = [projectTask, otherProjectTask, unassignedTask];

  it("returns every task for 'all'", () => {
    expect(filterTasksByProject(tasks, { type: "all" })).toEqual(tasks);
  });

  it("returns only unassigned tasks for 'no-project'", () => {
    expect(filterTasksByProject(tasks, { type: "no-project" })).toEqual([unassignedTask]);
  });

  it("returns only tasks in the given project for a project filter", () => {
    expect(filterTasksByProject(tasks, { type: "project", projectId: "proj-1" })).toEqual([projectTask]);
  });
});
