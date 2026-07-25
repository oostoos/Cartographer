import { useCallback } from "react";

import { useAsyncResource } from "@common/hooks/use-async-resource";

import {
  createTask as createTaskRequest,
  fetchTasks,
  setTaskCompleted as setTaskCompletedRequest,
} from "./tasks-api";
import type { TTask } from "./types";

export interface IUseTasksResult {
  tasks: TTask[];
  isLoading: boolean;
  error: string | null;
  createTask: (title: string, description: string) => Promise<void>;
  toggleTaskCompleted: (taskId: string, completed: boolean) => Promise<void>;
  applyTaskUpdate: (updated: TTask) => void;
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
    async (title: string, description: string) => {
      const task = await createTaskRequest({ title, description });
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

  return { tasks, isLoading, error, createTask, toggleTaskCompleted, applyTaskUpdate };
}
