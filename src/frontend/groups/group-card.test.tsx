import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";

import { GroupCard } from "./group-card";
import { GROUP_COLOR_PALETTE } from "./group-color-palette";
import type { TGroup } from "./types";

const GROUP: TGroup = {
  id: "1",
  name: "Home renovation",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  color: GROUP_COLOR_PALETTE[0],
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
          onChangeColor={vi.fn()}
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

  it("switches to an inline rename input and color picker when the edit button is clicked", () => {
    renderCard();

    fireEvent.click(screen.getByRole("button", { name: "Edit Home renovation" }));

    expect(screen.getByLabelText("Rename Home renovation")).toHaveValue("Home renovation");
    expect(screen.getByRole("group", { name: "Home renovation color" })).toBeInTheDocument();
  });

  it("calls onRename with the trimmed new name on blur", async () => {
    const onRename = vi.fn().mockResolvedValue(undefined);
    renderCard({ onRename });

    fireEvent.click(screen.getByRole("button", { name: "Edit Home renovation" }));
    fireEvent.change(screen.getByLabelText("Rename Home renovation"), { target: { value: "  Home projects  " } });
    fireEvent.blur(screen.getByLabelText("Rename Home renovation"));

    expect(onRename).toHaveBeenCalledWith("Home projects");
  });

  it("does not call onRename when the name is unchanged", () => {
    const onRename = vi.fn();
    renderCard({ onRename });

    fireEvent.click(screen.getByRole("button", { name: "Edit Home renovation" }));
    fireEvent.blur(screen.getByLabelText("Rename Home renovation"));

    expect(onRename).not.toHaveBeenCalled();
  });

  it("cancels the rename on Escape without calling onRename", () => {
    const onRename = vi.fn();
    renderCard({ onRename });

    fireEvent.click(screen.getByRole("button", { name: "Edit Home renovation" }));
    fireEvent.change(screen.getByLabelText("Rename Home renovation"), { target: { value: "Should not save" } });
    fireEvent.keyDown(screen.getByLabelText("Rename Home renovation"), { key: "Escape" });

    expect(onRename).not.toHaveBeenCalled();
    expect(screen.getByText("Home renovation")).toBeInTheDocument();
  });

  it("calls onChangeColor immediately when a swatch is clicked", () => {
    const onChangeColor = vi.fn();
    renderCard({ onChangeColor });

    fireEvent.click(screen.getByRole("button", { name: "Edit Home renovation" }));
    fireEvent.click(screen.getByRole("button", { name: `Home renovation color: ${GROUP_COLOR_PALETTE[3]}` }));

    expect(onChangeColor).toHaveBeenCalledWith(GROUP_COLOR_PALETTE[3]);
  });

  it("keeps the edit block open when focus moves from the rename input to a swatch", () => {
    const onRename = vi.fn();
    renderCard({ onRename });

    fireEvent.click(screen.getByRole("button", { name: "Edit Home renovation" }));
    const swatch = screen.getByRole("button", { name: `Home renovation color: ${GROUP_COLOR_PALETTE[3]}` });
    fireEvent.blur(screen.getByLabelText("Rename Home renovation"), { relatedTarget: swatch });

    expect(onRename).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Rename Home renovation")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Home renovation color" })).toBeInTheDocument();
  });

  it("still calls onChangeColor after focus moved from the input to the swatch first", () => {
    const onChangeColor = vi.fn();
    renderCard({ onChangeColor });

    fireEvent.click(screen.getByRole("button", { name: "Edit Home renovation" }));
    const swatch = screen.getByRole("button", { name: `Home renovation color: ${GROUP_COLOR_PALETTE[3]}` });
    fireEvent.blur(screen.getByLabelText("Rename Home renovation"), { relatedTarget: swatch });
    fireEvent.click(swatch);

    expect(onChangeColor).toHaveBeenCalledWith(GROUP_COLOR_PALETTE[3]);
  });

  it("submits the rename and closes when focus leaves the edit block entirely", () => {
    const onRename = vi.fn().mockResolvedValue(undefined);
    renderCard({ onRename });

    fireEvent.click(screen.getByRole("button", { name: "Edit Home renovation" }));
    fireEvent.change(screen.getByLabelText("Rename Home renovation"), { target: { value: "Home projects" } });
    fireEvent.blur(screen.getByLabelText("Rename Home renovation"), { relatedTarget: document.body });

    expect(onRename).toHaveBeenCalledWith("Home projects");
  });
});
