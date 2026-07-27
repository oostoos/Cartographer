import type { TTask } from "./types";

export type TTaskFilter =
  | { type: "all" }
  | { type: "no-group" }
  | { type: "group"; groupId: string };

const GROUP_PARAM_KEY = "group";
const NO_GROUP_PARAM_VALUE = "none";

/** Reads the active task filter from the URL's ?group= param. Absent means "all". */
export function parseTaskFilter(searchParams: URLSearchParams): TTaskFilter {
  const value = searchParams.get(GROUP_PARAM_KEY);
  if (value === null) return { type: "all" };
  if (value === NO_GROUP_PARAM_VALUE) return { type: "no-group" };
  return { type: "group", groupId: value };
}

/** Builds the ?group= param value for a filter, or undefined to omit it entirely ("all"). */
export function buildTaskFilterParam(filter: TTaskFilter): string | undefined {
  if (filter.type === "all") return undefined;
  if (filter.type === "no-group") return NO_GROUP_PARAM_VALUE;
  return filter.groupId;
}

/** Filters tasks down to the ones matching the given filter. */
export function filterTasksByGroup(tasks: TTask[], filter: TTaskFilter): TTask[] {
  if (filter.type === "all") return tasks;
  if (filter.type === "no-group") return tasks.filter((task) => task.group_id === null);
  return tasks.filter((task) => task.group_id === filter.groupId);
}
