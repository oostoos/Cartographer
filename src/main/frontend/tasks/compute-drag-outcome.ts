import type { DragEndEvent } from "@dnd-kit/core";

import { computeReorderedTaskIds } from "./compute-reordered-task-ids";

export type TDragOutcome =
  | { type: "reorder"; taskIds: string[] }
  | { type: "assign-project"; taskId: string; projectId: string }
  | null;

const PROJECT_DROP_ID_PREFIX = "project-drop:";

/** The droppable id a project card in the sidebar should register under. */
export function buildProjectDropId(projectId: string): string {
  return `${PROJECT_DROP_ID_PREFIX}${projectId}`;
}

interface IProjectDropData {
  type?: string;
  projectId?: string;
}

/** Interprets a drag-end event as either a task reorder or a drop onto a project card
 * (identified by `over.data.current.type === "project"`, set by the project card's
 * `useDroppable`), or null if neither applies. */
export function computeDragOutcome(activeTaskIds: string[], event: DragEndEvent): TDragOutcome {
  const { active, over } = event;
  if (!over) return null;

  const overData = over.data.current as IProjectDropData | undefined;
  if (overData?.type === "project" && overData.projectId) {
    return { type: "assign-project", taskId: String(active.id), projectId: overData.projectId };
  }

  const reordered = computeReorderedTaskIds(activeTaskIds, event);
  return reordered ? { type: "reorder", taskIds: reordered } : null;
}
