import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as profileApi from "../profile/profile-api";
import * as projectsApi from "../projects/projects-api";
import * as tasksApi from "../tasks/tasks-api";
import type { TTask } from "../tasks/types";
import { AppRoutes } from "./router";

const TASK: TTask = {
  id: "abc123",
  title: "Buy milk",
  description: "",
  completed: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  completed_at: null,
  order: 0,
  project_id: null,
};

function renderAtPath(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe("AppRoutes", () => {
  beforeEach(() => {
    // TasksPage/TaskDetailPanel/ProfilePage fetch on mount; stub them so route tests don't fire real network calls.
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([TASK]);
    vi.spyOn(tasksApi, "fetchTask").mockResolvedValue(TASK);
    vi.spyOn(projectsApi, "fetchProjects").mockResolvedValue([]);
    vi.spyOn(profileApi, "fetchProfile").mockResolvedValue({ display_name: "Explorer" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("redirects / to /tasks", () => {
    renderAtPath("/");

    expect(screen.getByRole("heading", { name: "Tasks" })).toBeInTheDocument();
  });

  it("renders the tasks page at /tasks", () => {
    renderAtPath("/tasks");

    expect(screen.getByRole("heading", { name: "Tasks" })).toBeInTheDocument();
  });

  it("renders the task detail panel beside the list at /tasks/:taskId", async () => {
    renderAtPath("/tasks/abc123");

    expect(screen.getByRole("heading", { name: "Tasks" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument());
  });

  it("renders the profile page at /profile", () => {
    renderAtPath("/profile");

    expect(screen.getByRole("heading", { name: "Profile" })).toBeInTheDocument();
  });

  it("always renders the persistent nav regardless of route", () => {
    renderAtPath("/profile");

    expect(screen.getByText("Cartographer")).toBeInTheDocument();
  });
});
