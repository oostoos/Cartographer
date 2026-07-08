// @manualReviewRequested: 2026-07-06
import { apiDelete, apiGet, apiPatch, apiPost } from "../../core/api/apiClient";

export type DurationBucket =
  "under_5_min" | "5_to_10_min" | "10_to_30_min" | "30_to_60_min" | "over_60_min";

export type Task = {
  id: string;
  title: string;
  description: string;
  projectId: string;
  workspaceId: string;
  blockId: string;
  parentTaskId: string;
  isArchived: boolean;
  createdAt: string;
  tags: string[];
  dueDate: string | null;
  scheduledAt: string;
  isComplete: boolean;
  completedAt: string;
  isSkipped: boolean;
  isSkippable: boolean;
  order: number;
  durationBucket: DurationBucket | null;
  /** A precise time estimate in minutes, populated only for a task generated from a block's
   * BlockTaskTemplate (see app/blocks/blockApi.ts) — used to compute a block's
   * scheduled-vs-allotted time on the Today page. 0 means unset.
   */
  estimatedMinutes: number;
  /** How many of this task's direct subtasks are strictly complete, out of how many exist —
   * null for a task with no subtasks, or when the response this task came from doesn't compute
   * subtask counts at all.
   */
  subtaskCount: { completed: number; total: number } | null;
};

export type CreateTaskInput = {
  title: string;
  description?: string;
  projectId?: string;
  workspaceId?: string;
  blockId?: string;
  parentTaskId?: string;
  tags?: string[];
  dueDate?: string | null;
  scheduledAt?: string;
  isSkippable?: boolean;
  estimatedMinutes?: number;
};

export type TaskFilters = {
  projectId?: string;
  parentTaskId?: string;
  blockId?: string;
};

/** Lists every task, optionally narrowed to one project, to one parent task's direct subtasks,
 * or to one block's nested tasks (mutually exclusive filters — if more than one is given,
 * projectId wins, then parentTaskId).
 */
export function fetchTasks(filters?: TaskFilters): Promise<Task[]> {
  const params = new URLSearchParams();
  if (filters?.projectId) params.set("projectId", filters.projectId);
  else if (filters?.parentTaskId) params.set("parentTaskId", filters.parentTaskId);
  else if (filters?.blockId) params.set("blockId", filters.blockId);
  const query = params.toString();
  return apiGet<Task[]>(`/api/tasks${query ? `?${query}` : ""}`);
}

/** Creates a task. An empty/omitted blockId means a one-off task; an empty/omitted parentTaskId
 * means a top-level task rather than a subtask.
 */
export function createTask(input: CreateTaskInput): Promise<Task> {
  return apiPost<Task>("/api/tasks", input);
}

/** Updates one or more of a task's fields. */
export function updateTask(
  taskId: string,
  changes: Partial<
    CreateTaskInput & {
      isArchived: boolean;
      isComplete: boolean;
      isSkipped: boolean;
      order: number;
      durationBucket: DurationBucket | null;
    }
  >,
): Promise<Task> {
  return apiPatch<Task>(`/api/tasks/${taskId}`, changes);
}

/** Deletes a task. */
export function deleteTask(taskId: string): Promise<void> {
  return apiDelete(`/api/tasks/${taskId}`);
}
