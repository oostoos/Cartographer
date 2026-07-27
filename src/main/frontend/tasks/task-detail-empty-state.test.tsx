import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TaskDetailEmptyState } from "./task-detail-empty-state";

describe("TaskDetailEmptyState", () => {
  it("renders a message prompting the user to select a task", () => {
    render(<TaskDetailEmptyState />);

    expect(screen.getByText("Select a task to see its details.")).toBeInTheDocument();
  });
});
