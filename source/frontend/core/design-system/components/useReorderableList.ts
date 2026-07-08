// @manualReviewRequested: 2026-07-06
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useEffect, useState } from "react";

type UseReorderableListOptions<T> = {
  items: T[] | undefined;
  getId: (item: T) => string;
  /** Called once per drop with the already-reordered full list — persist whichever items' order
   * actually changed and mirror the change into your own query cache, the same way every
   * drag-and-drop list in this app already did before this was extracted.
   */
  onReorder: (reordered: T[]) => void;
};

/** The optimistic-reorder lifecycle shared by every drag-and-drop-reorderable list in the app:
 * local state reorders in the exact same render as the drop (so there's only one motion, not one
 * for dnd-kit's own drop animation and a second once TanStack Query's cache notification catches
 * up a tick later), cleared once the server's own data reflects the same order. Persisting the
 * change is entirely the caller's job via onReorder — this hook only owns drag mechanics and the
 * optimistic state in between.
 */
export function useReorderableList<T>({ items, getId, onReorder }: UseReorderableListOptions<T>) {
  const [optimisticItems, setOptimisticItems] = useState<T[] | null>(null);
  const displayedItems = optimisticItems ?? items;

  useEffect(() => {
    if (!optimisticItems || !items) return;
    const matchesServer =
      items.length === optimisticItems.length &&
      items.every((item, index) => getId(item) === getId(optimisticItems[index]));
    if (matchesServer) setOptimisticItems(null);
  }, [items, optimisticItems, getId]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /** Applies an arbitrary new order immediately (optimistic state) and persists it — the same
   * path handleDragEnd uses, but callable directly for a non-drag reorder trigger (e.g. a "Sort
   * by [criteria]" button).
   */
  function reorder(reordered: T[]) {
    setOptimisticItems(reordered);
    onReorder(reordered);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !displayedItems) return;
    const oldIndex = displayedItems.findIndex((item) => getId(item) === active.id);
    const newIndex = displayedItems.findIndex((item) => getId(item) === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    reorder(arrayMove(displayedItems, oldIndex, newIndex));
  }

  return {
    displayedItems: displayedItems ?? [],
    itemIds: (displayedItems ?? []).map(getId),
    sensors,
    handleDragEnd,
    reorder,
  };
}
