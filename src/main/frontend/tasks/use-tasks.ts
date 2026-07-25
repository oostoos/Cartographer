import { useCallback, useEffect, useState } from "react";

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
}

/** Loads the task list on mount and exposes create/toggle actions that keep it in sync. */
export function useTasks(): IUseTasksResult {
  const [tasks, setTasks] = useState<TTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadTasks() {
      setIsLoading(true);
      setError(null);
      try {
        const loadedTasks = await fetchTasks();
        if (!isCancelled) setTasks(loadedTasks);
      } catch {
        if (!isCancelled) setError("Failed to load tasks.");
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadTasks();
    return () => {
      isCancelled = true;
    };
  }, []);

  const createTask = useCallback(async (title: string, description: string) => {
    const task = await createTaskRequest({ title, description });
    setTasks((current) => [...current, task]);
  }, []);

  const toggleTaskCompleted = useCallback(async (taskId: string, completed: boolean) => {
    const updated = await setTaskCompletedRequest(taskId, completed);
    setTasks((current) => current.map((task) => (task.id === updated.id ? updated : task)));
  }, []);

  return { tasks, isLoading, error, createTask, toggleTaskCompleted };
}
