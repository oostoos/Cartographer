import type { TTask } from "../tasks/types";

export interface IProjectTaskCounts {
  completed: number;
  total: number;
}

/** Counts how many of the given tasks belong to a project, and how many of those are completed. */
export function computeProjectTaskCounts(tasks: TTask[], projectId: string): IProjectTaskCounts {
  const tasksInProject = tasks.filter((task) => task.project_id === projectId);
  const completed = tasksInProject.filter((task) => task.completed).length;
  return { completed, total: tasksInProject.length };
}
