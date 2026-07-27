import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as projectsApi from "./projects-api";
import { useProjects } from "./use-projects";
import type { TProject } from "./types";

const PROJECT: TProject = {
  id: "1",
  name: "Home renovation",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  order: 0,
};

describe("useProjects", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads projects on mount", async () => {
    vi.spyOn(projectsApi, "fetchProjects").mockResolvedValue([PROJECT]);

    const { result } = renderHook(() => useProjects());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.projects).toEqual([PROJECT]);
    expect(result.current.error).toBeNull();
  });

  it("sets an error message when loading projects fails", async () => {
    vi.spyOn(projectsApi, "fetchProjects").mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useProjects());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe("Failed to load projects.");
    expect(result.current.projects).toEqual([]);
  });

  it("createProject appends the newly created project to state", async () => {
    vi.spyOn(projectsApi, "fetchProjects").mockResolvedValue([]);
    vi.spyOn(projectsApi, "createProject").mockResolvedValue(PROJECT);

    const { result } = renderHook(() => useProjects());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createProject("Home renovation");
    });

    expect(result.current.projects).toEqual([PROJECT]);
  });

  it("deleteProject removes the project from state", async () => {
    vi.spyOn(projectsApi, "fetchProjects").mockResolvedValue([PROJECT]);
    vi.spyOn(projectsApi, "deleteProject").mockResolvedValue({ id: PROJECT.id });

    const { result } = renderHook(() => useProjects());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.deleteProject(PROJECT.id);
    });

    expect(result.current.projects).toEqual([]);
  });
});
