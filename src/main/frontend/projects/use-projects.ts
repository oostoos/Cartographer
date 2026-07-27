import { useCallback } from "react";

import { useAsyncResource } from "@common/hooks/use-async-resource";

import { createProject as createProjectRequest, deleteProject as deleteProjectRequest, fetchProjects } from "./projects-api";
import type { TProject } from "./types";

export interface IUseProjectsResult {
  projects: TProject[];
  isLoading: boolean;
  error: string | null;
  createProject: (name: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
}

/** Loads the project list on mount and exposes create/delete actions that keep it in sync. */
export function useProjects(): IUseProjectsResult {
  const {
    value: projects,
    setValue: setProjects,
    isLoading,
    error,
  } = useAsyncResource<TProject[]>(fetchProjects, [], "Failed to load projects.");

  const createProject = useCallback(
    async (name: string) => {
      const project = await createProjectRequest({ name });
      setProjects((current) => [...current, project]);
    },
    [setProjects],
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      await deleteProjectRequest(projectId);
      setProjects((current) => current.filter((project) => project.id !== projectId));
    },
    [setProjects],
  );

  return { projects, isLoading, error, createProject, deleteProject };
}
