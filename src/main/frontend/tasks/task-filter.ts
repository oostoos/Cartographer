import type { TTask } from "./types";

export type TTaskFilter =
  | { type: "all" }
  | { type: "no-project" }
  | { type: "project"; projectId: string };

const PROJECT_PARAM_KEY = "project";
const NO_PROJECT_PARAM_VALUE = "none";

/** Reads the active task filter from the URL's ?project= param. Absent means "all". */
export function parseTaskFilter(searchParams: URLSearchParams): TTaskFilter {
  const value = searchParams.get(PROJECT_PARAM_KEY);
  if (value === null) return { type: "all" };
  if (value === NO_PROJECT_PARAM_VALUE) return { type: "no-project" };
  return { type: "project", projectId: value };
}

/** Builds the ?project= param value for a filter, or undefined to omit it entirely ("all"). */
export function buildTaskFilterParam(filter: TTaskFilter): string | undefined {
  if (filter.type === "all") return undefined;
  if (filter.type === "no-project") return NO_PROJECT_PARAM_VALUE;
  return filter.projectId;
}

/** Filters tasks down to the ones matching the given filter. */
export function filterTasksByProject(tasks: TTask[], filter: TTaskFilter): TTask[] {
  if (filter.type === "all") return tasks;
  if (filter.type === "no-project") return tasks.filter((task) => task.project_id === null);
  return tasks.filter((task) => task.project_id === filter.projectId);
}
