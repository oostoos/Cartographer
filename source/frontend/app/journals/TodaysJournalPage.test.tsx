// @manualReviewRequested: 2026-07-06
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { TodaysJournalPage } from "./TodaysJournalPage";

const INITIAL_TASK = {
  id: "task-1",
  title: "Water the plants",
  description: "",
  projectId: "",
  recurringTemplateId: "template-1",
  isArchived: false,
  createdAt: "2026-07-04T08:00:00",
  tags: [],
  dueDate: "2026-07-04",
  scheduledAt: "",
  isComplete: false,
  completedAt: "",
};

// Mutable so the mocked GET (which the app refetches after the PATCH mutation invalidates its
// query) reflects the PATCH's effect, the same way the real backend would.
let currentTask = { ...INITIAL_TASK };

const server = setupServer(
  http.get("/api/today", () =>
    HttpResponse.json({
      date: "2026-07-04",
      recurringTasks: [currentTask],
      dueTasks: [],
      backburnerTasks: [],
    }),
  ),
  http.patch("/api/tasks/task-1", async ({ request }) => {
    const body = (await request.json()) as { isComplete: boolean };
    currentTask = {
      ...currentTask,
      isComplete: body.isComplete,
      completedAt: body.isComplete ? "2026-07-04T10:00:00" : "",
    };
    return HttpResponse.json(currentTask);
  }),
  http.get("/api/projects", () => HttpResponse.json([])),
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  currentTask = { ...INITIAL_TASK };
});
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <TodaysJournalPage />
    </QueryClientProvider>,
  );
}

describe("TodaysJournalPage", () => {
  it("renders today's tasks", async () => {
    renderPage();
    expect(await screen.findByText("Water the plants")).toBeInTheDocument();
  });

  it("marks a task complete when its checkbox is clicked", async () => {
    renderPage();
    const checkbox = await screen.findByRole("checkbox");
    await userEvent.click(checkbox);
    expect(await screen.findByRole("checkbox", { checked: true })).toBeInTheDocument();
  });
});
