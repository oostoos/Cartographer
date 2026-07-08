// @manualReviewRequested: 2026-07-07
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type CreateWorkspaceInput,
  createWorkspace,
  deleteWorkspace,
  fetchWorkspaces,
  updateWorkspace,
} from "./workspaceApi";

/** The query key every workspace-list read/invalidation shares. */
export const WORKSPACES_QUERY_KEY = ["workspaces"];

/** Lists every workspace. */
export function useWorkspaces() {
  return useQuery({ queryKey: WORKSPACES_QUERY_KEY, queryFn: fetchWorkspaces });
}

/** Creates a workspace, then refreshes the workspace list. */
export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWorkspaceInput) => createWorkspace(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WORKSPACES_QUERY_KEY }),
  });
}

/** Updates a workspace's fields, then refreshes the workspace list. */
export function useUpdateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      workspaceId,
      changes,
    }: {
      workspaceId: string;
      changes: Partial<CreateWorkspaceInput & { isArchived: boolean }>;
    }) => updateWorkspace(workspaceId, changes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WORKSPACES_QUERY_KEY }),
  });
}

/** Deletes a workspace, then refreshes the workspace list. This also unassigns whatever tasks/
 * projects/notes/block templates pointed at it — callers that also read those lists should
 * invalidate their own query keys on success too.
 */
export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workspaceId: string) => deleteWorkspace(workspaceId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WORKSPACES_QUERY_KEY }),
  });
}
