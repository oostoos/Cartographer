import { isSameLocalDay } from "@lib/index";

import type { TTask } from "./types";

export interface IGroupedTasks {
  active: TTask[];
  completedToday: TTask[];
  completedPrior: TTask[];
}

/** Partition tasks into active, completed-today, and completed-on-a-prior-day buckets. */
export function groupTasks(tasks: TTask[], now: Date = new Date()): IGroupedTasks {
  const active: TTask[] = [];
  const completedToday: TTask[] = [];
  const completedPrior: TTask[] = [];

  for (const task of tasks) {
    if (!task.completed) {
      active.push(task);
    } else if (task.completed_at && isSameLocalDay(new Date(task.completed_at), now)) {
      completedToday.push(task);
    } else {
      completedPrior.push(task);
    }
  }

  completedToday.sort(_compareCompletedAtDescending);
  completedPrior.sort(_compareCompletedAtDescending);

  return { active, completedToday, completedPrior };
}

/** Sorts more-recently-completed tasks first; tasks with no completed_at sort last. */
function _compareCompletedAtDescending(a: TTask, b: TTask): number {
  if (!a.completed_at) return 1;
  if (!b.completed_at) return -1;
  return b.completed_at.localeCompare(a.completed_at);
}
