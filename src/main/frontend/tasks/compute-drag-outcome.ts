import type { DragEndEvent } from "@dnd-kit/core";

import { computeReorderedIds } from "./compute-reordered-ids";

export type TDragOutcome =
  | { type: "reorder-tasks"; taskIds: string[] }
  | { type: "reorder-groups"; groupIds: string[] }
  | { type: "assign-group"; taskId: string; groupId: string }
  | null;

const GROUP_DROP_ID_PREFIX = "group-drop:";

/** The droppable id a group card in the sidebar should register under. */
export function buildGroupDropId(groupId: string): string {
  return `${GROUP_DROP_ID_PREFIX}${groupId}`;
}

interface IGroupDropData {
  type?: string;
  groupId?: string;
}

/** Interprets a drag-end event as a group reorder (when the dragged item is a group), a drop
 * onto a group card (identified by `over.data.current.type === "group"`, set by the group
 * card's `useDroppable`/`useSortable`), or a task reorder — whichever applies. Null if none do. */
export function computeDragOutcome(
  activeTaskIds: string[],
  activeGroupIds: string[],
  event: DragEndEvent,
): TDragOutcome {
  const { active, over } = event;
  if (!over) return null;

  const activeId = String(active.id);

  if (activeGroupIds.includes(activeId)) {
    const reordered = computeReorderedIds(activeGroupIds, event);
    return reordered ? { type: "reorder-groups", groupIds: reordered } : null;
  }

  const overData = over.data.current as IGroupDropData | undefined;
  if (overData?.type === "group" && overData.groupId) {
    return { type: "assign-group", taskId: activeId, groupId: overData.groupId };
  }

  const reordered = computeReorderedIds(activeTaskIds, event);
  return reordered ? { type: "reorder-tasks", taskIds: reordered } : null;
}
