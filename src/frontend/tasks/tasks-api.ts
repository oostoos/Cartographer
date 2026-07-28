import { deleteJson, getJson, patchJson, postJson } from "@lib-stack/api/http-client";

import type { TTask } from "./types";

// Mirrors src/backend/tasks/schemas.py's TaskCreatePayload — keep in sync.
export type TTaskCreatePayload = {
  title: string;
  description: string;
  group_id?: string | null;
};

// Mirrors src/backend/tasks/schemas.py's TaskUpdatePayload — keep in sync.
export type TTaskUpdatePayload = {
  title?: string;
  description?: string;
};

// Mirrors src/backend/tasks/schemas.py's TaskReorderPayload — keep in sync.
export type TTaskReorderPayload = {
  task_ids: string[];
};

/** Fetch every task. */
export function fetchTasks(): Promise<TTask[]> {
  return getJson<TTask[]>("/tasks");
}

/** Fetch a single task by id. */
export function fetchTask(taskId: string): Promise<TTask> {
  return getJson<TTask>(`/tasks/${taskId}`);
}

/** Create a new task. */
export function createTask(payload: TTaskCreatePayload): Promise<TTask> {
  return postJson<TTask>("/tasks", payload);
}

/** Edit a task's title and/or description. */
export function updateTask(taskId: string, payload: TTaskUpdatePayload): Promise<TTask> {
  return patchJson<TTask>(`/tasks/${taskId}`, payload);
}

/** Toggle a task's completed flag. */
export function setTaskCompleted(taskId: string, completed: boolean): Promise<TTask> {
  return patchJson<TTask>(`/tasks/${taskId}/complete`, { completed });
}

/** Reorder tasks to match the given id sequence. Returns every task, freshly sorted. */
export function reorderTasks(taskIds: string[]): Promise<TTask[]> {
  return patchJson<TTask[]>("/tasks/reorder", { task_ids: taskIds } satisfies TTaskReorderPayload);
}

/** Assign a task to a group, or clear its group by passing null. */
export function setTaskGroup(taskId: string, groupId: string | null): Promise<TTask> {
  return patchJson<TTask>(`/tasks/${taskId}/group`, { group_id: groupId });
}

/** Set a task's energy requirement (1-5), or clear it by passing null. */
export function setTaskEnergyRequirement(taskId: string, energyRequirement: number | null): Promise<TTask> {
  return patchJson<TTask>(`/tasks/${taskId}/energy`, { energy_requirement: energyRequirement });
}

/** Set a task's impact (1-5), or clear it by passing null. */
export function setTaskImpact(taskId: string, impact: number | null): Promise<TTask> {
  return patchJson<TTask>(`/tasks/${taskId}/impact`, { impact });
}

/** Set a task's due date, or clear it by passing null. */
export function setTaskDueDate(taskId: string, dueDate: string | null): Promise<TTask> {
  return patchJson<TTask>(`/tasks/${taskId}/due-date`, { due_date: dueDate });
}

/** Set a task's time estimate in minutes, or clear it by passing null. */
export function setTaskTimeEstimateMinutes(taskId: string, timeEstimateMinutes: number | null): Promise<TTask> {
  return patchJson<TTask>(`/tasks/${taskId}/time-estimate`, { time_estimate_minutes: timeEstimateMinutes });
}

/** Delete a task. */
export function deleteTask(taskId: string): Promise<{ id: string }> {
  return deleteJson<{ id: string }>(`/tasks/${taskId}`);
}
