import type { DragEndEvent } from "@dnd-kit/core";
import { describe, expect, it } from "vitest";

import { buildProjectDropId, computeDragOutcome } from "./compute-drag-outcome";

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

describe("buildProjectDropId", () => {
  it("namespaces the project id so it can't collide with a task id", () => {
    expect(buildProjectDropId("proj-1")).toBe("project-drop:proj-1");
  });
});

describe("computeDragOutcome", () => {
  it("returns an assign-project outcome when dropped on a project droppable", () => {
    const event = buildDragEndEvent("task-1", {
      id: buildProjectDropId("proj-1"),
      data: { type: "project", projectId: "proj-1" },
    });

    const outcome = computeDragOutcome(["task-1", "task-2"], event);

    expect(outcome).toEqual({ type: "assign-project", taskId: "task-1", projectId: "proj-1" });
  });

  it("returns a reorder outcome when dropped on another task in the list", () => {
    const event = buildDragEndEvent("task-1", { id: "task-2" });

    const outcome = computeDragOutcome(["task-1", "task-2"], event);

    expect(outcome).toEqual({ type: "reorder", taskIds: ["task-2", "task-1"] });
  });

  it("returns null when there is no drop target", () => {
    const event = buildDragEndEvent("task-1", null);

    expect(computeDragOutcome(["task-1", "task-2"], event)).toBeNull();
  });

  it("returns null when dropped back on its own starting slot", () => {
    const event = buildDragEndEvent("task-1", { id: "task-1" });

    expect(computeDragOutcome(["task-1", "task-2"], event)).toBeNull();
  });
});
