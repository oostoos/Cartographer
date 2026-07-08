// @manualReviewRequested: 2026-07-07
import { apiDelete, apiGet, apiPatch, apiPost } from "../../core/api/apiClient";

export type Workspace = {
  id: string;
  title: string;
  description: string;
  /** A key into the design system's fixed block-color palette (see app/blocks/blockColor.ts) —
   * "" means no color chosen yet.
   */
  color: string;
  isArchived: boolean;
  createdAt: string;
};

export type CreateWorkspaceInput = {
  title: string;
  description?: string;
  color?: string;
};

/** Lists every workspace. */
export function fetchWorkspaces(): Promise<Workspace[]> {
  return apiGet<Workspace[]>("/api/workspaces");
}

/** Creates a workspace. */
export function createWorkspace(input: CreateWorkspaceInput): Promise<Workspace> {
  return apiPost<Workspace>("/api/workspaces", input);
}

/** Updates one or more of a workspace's fields. */
export function updateWorkspace(
  workspaceId: string,
  changes: Partial<CreateWorkspaceInput & { isArchived: boolean }>,
): Promise<Workspace> {
  return apiPatch<Workspace>(`/api/workspaces/${workspaceId}`, changes);
}

/** Deletes a workspace — every task/project/note/block template that pointed at it is unassigned
 * (workspaceId cleared back to ""), never deleted, since a workspace is a collection lens, not an
 * owning parent.
 */
export function deleteWorkspace(workspaceId: string): Promise<void> {
  return apiDelete(`/api/workspaces/${workspaceId}`);
}
