import type { DragEndEvent } from "@dnd-kit/core";
import { describe, expect, it } from "vitest";

import { computeReorderedIds } from "./compute-reordered-ids";

function buildDragEndEvent(activeId: string, overId: string | null): DragEndEvent {
  return {
    active: { id: activeId },
    over: overId === null ? null : { id: overId },
  } as unknown as DragEndEvent;
}

describe("computeReorderedIds", () => {
  it("moves the dragged id to sit where it was dropped", () => {
    const result = computeReorderedIds(["a", "b", "c"], buildDragEndEvent("a", "c"));

    expect(result).toEqual(["b", "c", "a"]);
  });

  it("moves an id backward when dropped earlier in the list", () => {
    const result = computeReorderedIds(["a", "b", "c"], buildDragEndEvent("c", "a"));

    expect(result).toEqual(["c", "a", "b"]);
  });

  it("returns null when dropped outside any droppable", () => {
    const result = computeReorderedIds(["a", "b", "c"], buildDragEndEvent("a", null));

    expect(result).toBeNull();
  });

  it("returns null when dropped back on its own starting slot", () => {
    const result = computeReorderedIds(["a", "b", "c"], buildDragEndEvent("a", "a"));

    expect(result).toBeNull();
  });

  it("returns null when the dragged id is unknown", () => {
    const result = computeReorderedIds(["a", "b", "c"], buildDragEndEvent("unknown", "a"));

    expect(result).toBeNull();
  });

  it("returns null when the drop target id is unknown", () => {
    const result = computeReorderedIds(["a", "b", "c"], buildDragEndEvent("a", "unknown"));

    expect(result).toBeNull();
  });
});
