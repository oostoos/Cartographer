import type { DragEndEvent } from "@dnd-kit/core";
import { describe, expect, it } from "vitest";

import { buildGroupDropId, computeDragOutcome } from "./compute-drag-outcome";

function buildDragEndEvent(
  activeId: string,
  over: { id: string; data?: Record<string, unknown> } | null,
): DragEndEvent {
  return {
    active: { id: activeId },
    over:
      over === null
        ? null
        : { id: over.id, data: { current: over.data } },
  } as unknown as DragEndEvent;
}

describe("buildGroupDropId", () => {
  it("namespaces the group id so it can't collide with a task id", () => {
    expect(buildGroupDropId("group-1")).toBe("group-drop:group-1");
  });
});

describe("computeDragOutcome", () => {
  it("returns an assign-group outcome when a task is dropped on a group droppable", () => {
    const event = buildDragEndEvent("task-1", {
      id: buildGroupDropId("group-1"),
      data: { type: "group", groupId: "group-1" },
    });

    const outcome = computeDragOutcome(["task-1", "task-2"], ["group-1", "group-2"], event);

    expect(outcome).toEqual({ type: "assign-group", taskId: "task-1", groupId: "group-1" });
  });

  it("returns a reorder-tasks outcome when a task is dropped on another task in the list", () => {
    const event = buildDragEndEvent("task-1", { id: "task-2" });

    const outcome = computeDragOutcome(["task-1", "task-2"], ["group-1"], event);

    expect(outcome).toEqual({ type: "reorder-tasks", taskIds: ["task-2", "task-1"] });
  });

  it("returns a reorder-groups outcome when a group is dragged, even if dropped on a group droppable", () => {
    const event = buildDragEndEvent("group-1", {
      id: buildGroupDropId("group-2"),
      data: { type: "group", groupId: "group-2" },
    });

    const outcome = computeDragOutcome(["task-1"], ["group-1", "group-2"], event);

    expect(outcome).toEqual({ type: "reorder-groups", groupIds: ["group-2", "group-1"] });
  });

  it("returns null when a group is dragged but not dropped on another group", () => {
    const event = buildDragEndEvent("group-1", { id: "group-1" });

    expect(computeDragOutcome(["task-1"], ["group-1", "group-2"], event)).toBeNull();
  });

  it("returns null when there is no drop target", () => {
    const event = buildDragEndEvent("task-1", null);

    expect(computeDragOutcome(["task-1", "task-2"], ["group-1"], event)).toBeNull();
  });

  it("returns null when a task is dropped back on its own starting slot", () => {
    const event = buildDragEndEvent("task-1", { id: "task-1" });

    expect(computeDragOutcome(["task-1", "task-2"], ["group-1"], event)).toBeNull();
  });
});
