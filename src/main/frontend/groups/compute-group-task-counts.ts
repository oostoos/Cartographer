import type { TTask } from "../tasks/types";

export interface IGroupTaskCounts {
  completed: number;
  total: number;
}

/** Counts how many of the given tasks belong to a group, and how many of those are completed. */
export function computeGroupTaskCounts(tasks: TTask[], groupId: string): IGroupTaskCounts {
  const tasksInGroup = tasks.filter((task) => task.group_id === groupId);
  const completed = tasksInGroup.filter((task) => task.completed).length;
  return { completed, total: tasksInGroup.length };
}
