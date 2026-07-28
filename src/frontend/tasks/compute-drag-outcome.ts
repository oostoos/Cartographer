import type { DragEndEvent } from "@dnd-kit/core";

import { computeReorderedIds } from "./compute-reordered-ids";

export type TDragOutcome =
  | { type: "reorder-tasks"; taskIds: string[] }
  | { type: "reorder-groups"; groupIds: string[] }
  | { type: "assign-group"; taskId: string; groupId: string }
  | null;

/** The `useSortable`/`useDroppable` `data.type` value a group card tags itself with, so a
 * drop can be recognized as "onto a group" here. Shared with the group card that sets it
 * (see `groups/group-card.tsx`) — the single source of truth for this drag/drop contract. */
export const GROUP_DROP_DATA_TYPE = "group";

interface IGroupDropData {
  type?: typeof GROUP_DROP_DATA_TYPE;
  groupId?: string;
}

/** Interprets a drag-end event as a group reorder (when the dragged item is a group), a drop
 * onto a group card (identified by `over.data.current.type === GROUP_DROP_DATA_TYPE`, set by
 * the group card's `useDroppable`/`useSortable`), or a task reorder — whichever applies. Null
 * if none do. */
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
  if (overData?.type === GROUP_DROP_DATA_TYPE && overData.groupId) {
    return { type: "assign-group", taskId: activeId, groupId: overData.groupId };
  }

  const reordered = computeReorderedIds(activeTaskIds, event);
  return reordered ? { type: "reorder-tasks", taskIds: reordered } : null;
}
