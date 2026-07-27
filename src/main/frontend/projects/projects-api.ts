import { deleteJson, getJson, postJson } from "@common/api/http-client";

import type { TProject } from "./types";

// Mirrors src/main/backend/projects/schemas.py's ProjectCreatePayload — keep in sync.
export type TProjectCreatePayload = {
  name: string;
};

/** Fetch every project. */
export function fetchProjects(): Promise<TProject[]> {
  return getJson<TProject[]>("/projects");
}

/** Create a new project. */
export function createProject(payload: TProjectCreatePayload): Promise<TProject> {
  return postJson<TProject>("/projects", payload);
}

/** Delete a project. Every task in it falls back to having no project. */
export function deleteProject(projectId: string): Promise<{ id: string }> {
  return deleteJson<{ id: string }>(`/projects/${projectId}`);
}
