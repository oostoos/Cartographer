import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as profileApi from "../profile/profile-api";
import * as tasksApi from "../tasks/tasks-api";
import { AppRoutes } from "./router";

function renderAtPath(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe("AppRoutes", () => {
  beforeEach(() => {
    // TasksPage/TaskDetailPage/ProfilePage fetch on mount; stub them so route tests don't fire real network calls.
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([]);
    vi.spyOn(tasksApi, "fetchTask").mockRejectedValue(new Error("not mocked for this route test"));
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

  it("renders the task detail page at /tasks/:taskId", () => {
    renderAtPath("/tasks/abc123");

    expect(screen.getByRole("heading", { name: "Task detail" })).toBeInTheDocument();
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
