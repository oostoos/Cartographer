import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

/** The new id order implied by a drag-end event over `currentIds`, or null if nothing moved
 * (dropped outside a droppable, or dropped back on its own starting slot). */
export function computeReorderedIds(currentIds: string[], event: DragEndEvent): string[] | null {
  const { active, over } = event;
  if (!over || active.id === over.id) return null;

  const oldIndex = currentIds.indexOf(String(active.id));
  const newIndex = currentIds.indexOf(String(over.id));
  if (oldIndex === -1 || newIndex === -1) return null;

  return arrayMove(currentIds, oldIndex, newIndex);
}
