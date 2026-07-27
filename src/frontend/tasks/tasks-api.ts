import { deleteJson, getJson, patchJson, postJson } from "@common/api/http-client";

import type { TTask } from "./types";

// Mirrors src/main/backend/tasks/schemas.py's TaskCreatePayload/TaskUpdatePayload — keep in sync.
export type TTaskCreatePayload = {
  title: string;
  description: string;
  group_id?: string | null;
};

export type TTaskUpdatePayload = {
  title?: string;
  description?: string;
};

// Mirrors src/main/backend/tasks/schemas.py's TaskReorderPayload — keep in sync.
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

/** Delete a task. */
export function deleteTask(taskId: string): Promise<{ id: string }> {
  return deleteJson<{ id: string }>(`/tasks/${taskId}`);
}
