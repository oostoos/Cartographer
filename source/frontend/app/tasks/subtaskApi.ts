// @manualReviewRequested: 2026-07-06
import { apiDelete, apiGet, apiPatch, apiPost } from "../../core/api/apiClient";

export type Subtask = {
  id: string;
  taskId: string;
  title: string;
  isComplete: boolean;
  isSkipped: boolean;
  createdAt: string;
};

export type CreateSubtaskInput = {
  taskId: string;
  title: string;
};

/** Lists a task's subtasks, oldest first. */
export function fetchSubtasks(taskId: string): Promise<Subtask[]> {
  return apiGet<Subtask[]>(`/api/subtasks?taskId=${encodeURIComponent(taskId)}`);
}

/** Creates a subtask. */
export function createSubtask(input: CreateSubtaskInput): Promise<Subtask> {
  return apiPost<Subtask>("/api/subtasks", input);
}

/** Updates one or more of a subtask's fields. Setting isComplete clears isSkipped (and vice
 * versa) — a subtask is never both at once.
 */
export function updateSubtask(
  subtaskId: string,
  changes: Partial<{ title: string; isComplete: boolean; isSkipped: boolean }>,
): Promise<Subtask> {
  return apiPatch<Subtask>(`/api/subtasks/${subtaskId}`, changes);
}

/** Deletes a subtask. */
export function deleteSubtask(subtaskId: string): Promise<void> {
  return apiDelete(`/api/subtasks/${subtaskId}`);
}
