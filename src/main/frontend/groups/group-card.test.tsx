import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DndContext } from "@dnd-kit/core";

import { ProjectCard } from "./project-card";
import type { TProject } from "./types";

const PROJECT: TProject = {
  id: "1",
  name: "Home renovation",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  order: 0,
};

function renderCard(overrides: Partial<Parameters<typeof ProjectCard>[0]> = {}) {
  return render(
    <DndContext>
      <ProjectCard
        project={PROJECT}
        completedCount={1}
        totalCount={3}
        isActive={false}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
        {...overrides}
      />
    </DndContext>,
  );
}

describe("ProjectCard", () => {
  it("renders the project name and completed/total count", () => {
    renderCard();

    expect(screen.getByText("Home renovation")).toBeInTheDocument();
    expect(screen.getByText("1/3")).toBeInTheDocument();
  });

  it("calls onSelect when clicked", () => {
    const onSelect = vi.fn();
    renderCard({ onSelect });

    fireEvent.click(screen.getByText("Home renovation"));

    expect(onSelect).toHaveBeenCalled();
  });

  it("calls onDelete when the delete button is clicked", () => {
    const onDelete = vi.fn();
    renderCard({ onDelete });

    fireEvent.click(screen.getByRole("button", { name: "Delete Home renovation" }));

    expect(onDelete).toHaveBeenCalled();
  });
});
