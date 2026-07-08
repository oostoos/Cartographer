// @manualReviewRequested: 2026-07-06
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type CreateTaskInput,
  type DurationBucket,
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
} from "./taskApi";

/** The query key every task-list read/invalidation shares. */
export const TASKS_QUERY_KEY = ["tasks"];

/** The query key for one project's task list (or every task, if omitted) — shared by the query
 * itself and any optimistic cache write that needs to target the same list.
 */
export function tasksQueryKey(projectId?: string) {
  return [...TASKS_QUERY_KEY, "project", projectId ?? "all"];
}

/** Lists every task, optionally narrowed to one project. */
export function useTasks(projectId?: string) {
  return useQuery({
    queryKey: tasksQueryKey(projectId),
    queryFn: () => fetchTasks({ projectId }),
  });
}

/** Lists one task's direct subtasks. */
export function useChildTasks(parentTaskId: string) {
  return useQuery({
    queryKey: [...TASKS_QUERY_KEY, "children", parentTaskId],
    queryFn: () => fetchTasks({ parentTaskId }),
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
      changes: Partial<
        CreateTaskInput & {
          isArchived: boolean;
          isComplete: boolean;
          isSkipped: boolean;
          order: number;
          durationBucket: DurationBucket | null;
        }
      >;
    }) => updateTask(taskId, changes),
    onSettled: () => queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY }),
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
