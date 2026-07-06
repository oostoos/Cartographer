import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type CreateProjectInput,
  createProject,
  deleteProject,
  fetchProjects,
  updateProject,
} from "./projectApi";

/** The query key every project-list read/invalidation shares. */
export const PROJECTS_QUERY_KEY = ["projects"];

/** Lists every project. */
export function useProjects() {
  return useQuery({ queryKey: PROJECTS_QUERY_KEY, queryFn: fetchProjects });
}

/** Creates a project, then refreshes the project list. */
export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProjectInput) => createProject(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY }),
  });
}

/** Updates a project's fields, then refreshes the project list. */
export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      changes,
    }: {
      projectId: string;
      changes: Partial<CreateProjectInput & { isArchived: boolean }>;
    }) => updateProject(projectId, changes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY }),
  });
}

/** Deletes a project (optionally moving its tasks elsewhere first), then refreshes the project
 * list. This also affects tasks (reassigned or cascade-deleted) — callers that also read
 * useTasks should invalidate TASKS_QUERY_KEY themselves on success, same as TaskListPage.tsx
 * composing useProjects today.
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      moveChildrenToProjectId,
    }: {
      projectId: string;
      moveChildrenToProjectId?: string;
    }) => deleteProject(projectId, moveChildrenToProjectId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY }),
  });
}
