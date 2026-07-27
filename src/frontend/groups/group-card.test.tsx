import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";

import { GroupCard } from "./group-card";
import type { TGroup } from "./types";

const GROUP: TGroup = {
  id: "1",
  name: "Home renovation",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  order: 0,
};

function renderCard(overrides: Partial<Parameters<typeof GroupCard>[0]> = {}) {
  return render(
    <DndContext>
      <SortableContext items={[GROUP.id]}>
        <GroupCard
          group={GROUP}
          completedCount={1}
          totalCount={3}
          isActive={false}
          onSelect={vi.fn()}
          onRename={vi.fn()}
          onDelete={vi.fn()}
          {...overrides}
        />
      </SortableContext>
    </DndContext>,
  );
}

describe("GroupCard", () => {
  it("renders the group name and completed/total count", () => {
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

  it("renders a drag handle for reordering", () => {
    renderCard();

    expect(screen.getByRole("button", { name: "Reorder Home renovation" })).toBeInTheDocument();
  });

  it("switches to an inline rename input when the rename button is clicked", () => {
    renderCard();

    fireEvent.click(screen.getByRole("button", { name: "Rename Home renovation" }));

    expect(screen.getByLabelText("Rename Home renovation")).toHaveValue("Home renovation");
  });

  it("calls onRename with the trimmed new name on blur", async () => {
    const onRename = vi.fn().mockResolvedValue(undefined);
    renderCard({ onRename });

    fireEvent.click(screen.getByRole("button", { name: "Rename Home renovation" }));
    fireEvent.change(screen.getByLabelText("Rename Home renovation"), { target: { value: "  Home projects  " } });
    fireEvent.blur(screen.getByLabelText("Rename Home renovation"));

    expect(onRename).toHaveBeenCalledWith("Home projects");
  });

  it("does not call onRename when the name is unchanged", () => {
    const onRename = vi.fn();
    renderCard({ onRename });

    fireEvent.click(screen.getByRole("button", { name: "Rename Home renovation" }));
    fireEvent.blur(screen.getByLabelText("Rename Home renovation"));

    expect(onRename).not.toHaveBeenCalled();
  });

  it("cancels the rename on Escape without calling onRename", () => {
    const onRename = vi.fn();
    renderCard({ onRename });

    fireEvent.click(screen.getByRole("button", { name: "Rename Home renovation" }));
    fireEvent.change(screen.getByLabelText("Rename Home renovation"), { target: { value: "Should not save" } });
    fireEvent.keyDown(screen.getByLabelText("Rename Home renovation"), { key: "Escape" });

    expect(onRename).not.toHaveBeenCalled();
    expect(screen.getByText("Home renovation")).toBeInTheDocument();
  });
});
