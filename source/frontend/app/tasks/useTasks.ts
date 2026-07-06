// @manualReviewRequested: 2026-07-06
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { type CreateTaskInput, createTask, deleteTask, fetchTasks, updateTask } from "./taskApi";

/** The query key every task-list read/invalidation shares. */
export const TASKS_QUERY_KEY = ["tasks"];

/** Lists every task, optionally narrowed to one project. */
export function useTasks(projectId?: string) {
  return useQuery({
    queryKey: [...TASKS_QUERY_KEY, projectId ?? "all"],
    queryFn: () => fetchTasks(projectId),
  });
}

/** Creates a task, then refreshes every task list. */
export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY }),
  });
}

/** Updates a task's fields, then refreshes every task list. */
export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      changes,
    }: {
      taskId: string;
      changes: Partial<CreateTaskInput & { isArchived: boolean; isComplete: boolean }>;
    }) => updateTask(taskId, changes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY }),
  });
}

/** Deletes a task, then refreshes every task list. */
export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY }),
  });
}
