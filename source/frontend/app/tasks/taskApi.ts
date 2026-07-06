// @manualReviewRequested: 2026-07-06
import { apiDelete, apiGet, apiPatch, apiPost } from "../../core/api/apiClient";

export type Task = {
  id: string;
  title: string;
  description: string;
  projectId: string;
  recurringTemplateId: string;
  isArchived: boolean;
  createdAt: string;
  tags: string[];
  dueDate: string | null;
  scheduledAt: string;
  isComplete: boolean;
  completedAt: string;
};

export type CreateTaskInput = {
  title: string;
  description?: string;
  projectId?: string;
  recurringTemplateId?: string;
  tags?: string[];
  dueDate?: string | null;
  scheduledAt?: string;
};

/** Lists every task, optionally narrowed to one project. */
export function fetchTasks(projectId?: string): Promise<Task[]> {
  const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";
  return apiGet<Task[]>(`/api/tasks${query}`);
}

/** Creates a task. An empty/omitted recurringTemplateId means a one-off task. */
export function createTask(input: CreateTaskInput): Promise<Task> {
  return apiPost<Task>("/api/tasks", input);
}

/** Updates one or more of a task's fields. */
export function updateTask(
  taskId: string,
  changes: Partial<CreateTaskInput & { isArchived: boolean; isComplete: boolean }>,
): Promise<Task> {
  return apiPatch<Task>(`/api/tasks/${taskId}`, changes);
}

/** Deletes a task. */
export function deleteTask(taskId: string): Promise<void> {
  return apiDelete(`/api/tasks/${taskId}`);
}
