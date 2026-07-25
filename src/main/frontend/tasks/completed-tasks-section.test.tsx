import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { CompletedTasksSection } from "./completed-tasks-section";
import type { TTask } from "./types";

function buildTask(overrides: Partial<TTask>): TTask {
  return {
    id: "1",
    title: "Buy milk",
    description: "",
    completed: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    completed_at: "2026-01-01T00:00:00Z",
    order: 0,
    ...overrides,
  };
}

function renderSection(tasks: TTask[], onToggleCompleted = vi.fn()) {
  return render(
    <MemoryRouter>
      <CompletedTasksSection tasks={tasks} onToggleCompleted={onToggleCompleted} />
    </MemoryRouter>,
  );
}

describe("CompletedTasksSection", () => {
  it("renders nothing when there are no completed-prior tasks", () => {
    const { container } = renderSection([]);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the count in the header and is collapsed by default", () => {
    renderSection([buildTask({ id: "1" }), buildTask({ id: "2" })]);

    expect(screen.getByRole("button", { name: /Completed \(2\)/ })).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("expands to show the tasks when the header is clicked", () => {
    renderSection([buildTask({ id: "1", title: "Buy milk" })]);

    fireEvent.click(screen.getByRole("button", { name: /Completed/ }));

    expect(screen.getByRole("link", { name: /Buy milk/ })).toBeInTheDocument();
  });

  it("collapses again when the header is clicked a second time", () => {
    renderSection([buildTask({ id: "1", title: "Buy milk" })]);

    const header = screen.getByRole("button", { name: /Completed/ });
    fireEvent.click(header);
    fireEvent.click(header);

    expect(screen.queryByRole("link", { name: /Buy milk/ })).not.toBeInTheDocument();
  });
});
