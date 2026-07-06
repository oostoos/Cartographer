import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type CreateSubtaskInput,
  createSubtask,
  deleteSubtask,
  fetchSubtasks,
  updateSubtask,
} from "./subtaskApi";

/** The query key every subtask-list read/invalidation shares. */
export const SUBTASKS_QUERY_KEY = ["subtasks"];

/** Lists one task's subtasks. */
export function useSubtasks(taskId: string) {
  return useQuery({
    queryKey: [...SUBTASKS_QUERY_KEY, taskId],
    queryFn: () => fetchSubtasks(taskId),
    enabled: !!taskId,
  });
}

/** Creates a subtask, then refreshes every subtask list. */
export function useCreateSubtask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSubtaskInput) => createSubtask(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SUBTASKS_QUERY_KEY }),
  });
}

/** Updates a subtask's fields, then refreshes every subtask list. */
export function useUpdateSubtask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      subtaskId,
      changes,
    }: {
      subtaskId: string;
      changes: Partial<{ title: string; isComplete: boolean; isSkipped: boolean }>;
    }) => updateSubtask(subtaskId, changes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SUBTASKS_QUERY_KEY }),
  });
}

/** Deletes a subtask, then refreshes every subtask list. */
export function useDeleteSubtask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subtaskId: string) => deleteSubtask(subtaskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SUBTASKS_QUERY_KEY }),
  });
}
