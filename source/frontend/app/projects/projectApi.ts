// @manualReviewRequested: 2026-07-06
import { apiDelete, apiGet, apiPatch, apiPost } from "../../core/api/apiClient";

export type Project = {
  id: string;
  title: string;
  description: string;
  parentProjectId: string;
  workspaceId: string;
  isArchived: boolean;
  createdAt: string;
};

export type CreateProjectInput = {
  title: string;
  description?: string;
  parentProjectId?: string;
  workspaceId?: string;
};

/** Lists every project. */
export function fetchProjects(): Promise<Project[]> {
  return apiGet<Project[]>("/api/projects");
}

/** Creates a project. */
export function createProject(input: CreateProjectInput): Promise<Project> {
  return apiPost<Project>("/api/projects", input);
}

/** Updates one or more of a project's fields. */
export function updateProject(
  projectId: string,
  changes: Partial<CreateProjectInput & { isArchived: boolean }>,
): Promise<Project> {
  return apiPatch<Project>(`/api/projects/${projectId}`, changes);
}

/** Deletes a project. If moveChildrenToProjectId is given, the project's direct tasks and direct
 * subprojects are reassigned there first; otherwise everything beneath it is cascade-deleted.
 */
export function deleteProject(projectId: string, moveChildrenToProjectId?: string): Promise<void> {
  return apiDelete(
    `/api/projects/${projectId}`,
    moveChildrenToProjectId ? { moveChildrenToProjectId } : undefined,
  );
}
