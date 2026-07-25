import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as tasksApi from "./tasks-api";
import { TasksPage } from "./tasks-page";
import type { TTask } from "./types";

const TASK: TTask = {
  id: "1",
  title: "Buy milk",
  description: "",
  completed: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

function renderPage() {
  return render(
    <MemoryRouter>
      <TasksPage />
    </MemoryRouter>,
  );
}

describe("TasksPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the Tasks heading immediately", () => {
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([]);

    renderPage();

    expect(screen.getByRole("heading", { name: "Tasks" })).toBeInTheDocument();
  });

  it("renders an empty state when there are no tasks", async () => {
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([]);

    renderPage();

    await waitFor(() => expect(screen.getByText(/No tasks yet/)).toBeInTheDocument());
  });

  it("renders each fetched task in the list", async () => {
    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue([TASK]);

    renderPage();

    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Buy milk" })).toBeInTheDocument(),
    );
  });

  it("renders an error message when loading fails", async () => {
    vi.spyOn(tasksApi, "fetchTasks").mockRejectedValue(new Error("network error"));

    renderPage();

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  });
});
