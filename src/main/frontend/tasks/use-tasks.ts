import { useCallback } from "react";

import { useAsyncResource } from "@common/hooks/use-async-resource";

import {
  createTask as createTaskRequest,
  fetchTasks,
  reorderTasks as reorderTasksRequest,
  setTaskCompleted as setTaskCompletedRequest,
  setTaskProject as setTaskProjectRequest,
} from "./tasks-api";
import type { TTask } from "./types";

export interface IUseTasksResult {
  tasks: TTask[];
  isLoading: boolean;
  error: string | null;
  createTask: (title: string, description: string, projectId?: string | null) => Promise<void>;
  toggleTaskCompleted: (taskId: string, completed: boolean) => Promise<void>;
  applyTaskUpdate: (updated: TTask) => void;
  reorderActiveTasks: (orderedActiveTaskIds: string[]) => Promise<void>;
  assignTaskProject: (taskId: string, projectId: string | null) => Promise<void>;
  unassignTasksFromProject: (projectId: string) => void;
}

/** Loads the task list on mount and exposes create/toggle actions that keep it in sync. */
export function useTasks(): IUseTasksResult {
  const {
    value: tasks,
    setValue: setTasks,
    isLoading,
    error,
  } = useAsyncResource<TTask[]>(fetchTasks, [], "Failed to load tasks.");

  const createTask = useCallback(
    async (title: string, description: string, projectId: string | null = null) => {
      const task = await createTaskRequest({ title, description, project_id: projectId });
      setTasks((current) => [...current, task]);
    },
    [setTasks],
  );

  const applyTaskUpdate = useCallback(
    (updated: TTask) => {
      setTasks((current) => current.map((task) => (task.id === updated.id ? updated : task)));
    },
    [setTasks],
  );

  const toggleTaskCompleted = useCallback(
    async (taskId: string, completed: boolean) => {
      const updated = await setTaskCompletedRequest(taskId, completed);
      applyTaskUpdate(updated);
    },
    [applyTaskUpdate],
  );

  const reorderActiveTasks = useCallback(
    async (orderedActiveTaskIds: string[]) => {
      setTasks((current) => _applyActiveTaskOrder(current, orderedActiveTaskIds));
      const updated = await reorderTasksRequest(orderedActiveTaskIds);
      setTasks(updated);
    },
    [setTasks],
  );

  const assignTaskProject = useCallback(
    async (taskId: string, projectId: string | null) => {
      const updated = await setTaskProjectRequest(taskId, projectId);
      applyTaskUpdate(updated);
    },
    [applyTaskUpdate],
  );

  const unassignTasksFromProject = useCallback(
    (projectId: string) => {
      setTasks((current) =>
        current.map((task) => (task.project_id === projectId ? { ...task, project_id: null } : task)),
      );
    },
    [setTasks],
  );

  return {
    tasks,
    isLoading,
    error,
    createTask,
    toggleTaskCompleted,
    applyTaskUpdate,
    reorderActiveTasks,
    assignTaskProject,
    unassignTasksFromProject,
  };
}

/** Reorders `tasks` so the (still-active) tasks in `orderedActiveTaskIds` come first, in that
 * sequence, followed by the completed tasks unchanged. Used to reflect a drag-reorder locally
 * before the backend confirms it. Unknown ids are dropped. */
function _applyActiveTaskOrder(tasks: TTask[], orderedActiveTaskIds: string[]): TTask[] {
  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  const reorderedActive = orderedActiveTaskIds
    .map((id) => tasksById.get(id))
    .filter((task): task is TTask => task !== undefined);
  const completed = tasks.filter((task) => task.completed);
  return [...reorderedActive, ...completed];
}
