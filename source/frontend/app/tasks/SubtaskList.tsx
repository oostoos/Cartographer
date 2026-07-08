// @manualReviewRequested: 2026-07-06
import { useQueryClient } from "@tanstack/react-query";

import { EmojiIcon } from "../../core/design-system/components/EmojiIcon";
import { useReorderableList } from "../../core/design-system/components/useReorderableList";
import { TaskList } from "./TaskList";
import type { Task } from "./taskApi";
import { TASKS_QUERY_KEY, useChildTasks, useCreateTask, useUpdateTask } from "./useTasks";
import "./SubtaskList.css";

type SubtaskListProps = {
  taskId: string;
};

const SUBTASKS_GROUP_KEY = "subtasks";

/** A task's checklist: each subtask is an ordinary Task with parentTaskId set to this one
 * (nesting is capped at a single level — a subtask can never itself gain subtasks). Complete and
 * Skip both use the same Checkbox/icon-button toggle idiom as a top-level task (TaskRow) — the
 * checkbox always stays visible, even once resolved, and Skip's icon swaps to "undo" instead of
 * being replaced by a separate text button. Drag-and-drop reordering and the bottom "type a title,
 * press Enter" create row both come from the shared List component — there is no separate "Add
 * subtask" button, since a subtask only ever needs a title.
 */
export function SubtaskList({ taskId }: SubtaskListProps) {
  const { data: subtasks, isLoading } = useChildTasks(taskId);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const queryClient = useQueryClient();

  /** Persists a newly-ordered checklist, PATCHing only the subtasks whose order actually changed,
   * and mirrors the new order into this task's own children query so the list doesn't flicker
   * back to the old order until the PATCH round-trip resolves.
   */
  function persistReorder(reordered: Task[]) {
    const reindexed = reordered.map((subtask, index) => ({ ...subtask, order: index }));
    queryClient.setQueryData<Task[]>([...TASKS_QUERY_KEY, "children", taskId], reindexed);
    reordered.forEach((subtask, index) => {
      if (subtask.order !== index) {
        updateTask.mutate({ taskId: subtask.id, changes: { order: index } });
      }
    });
  }

  const { displayedItems, itemIds, sensors, handleDragEnd } = useReorderableList({
    items: subtasks,
    getId: (subtask) => subtask.id,
    onReorder: persistReorder,
  });

  return (
    <div className="cg-subtask-list">
      <h3>
        Subtasks <EmojiIcon symbol="🧩" label="Subtasks" />
      </h3>
      {isLoading && <p>Loading subtasks…</p>}
      <TaskList
        tasks={displayedItems}
        capabilities={{ allowDelete: true, allowEdit: false }}
        newItemLine={{
          placeholder: "New subtask",
          ariaLabel: "New subtask title",
          onCreateItem: (title) => createTask.mutate({ title, parentTaskId: taskId }),
        }}
        groupKey={SUBTASKS_GROUP_KEY}
        reorderable={{ groupKey: SUBTASKS_GROUP_KEY, itemIds, sensors, onDragEnd: handleDragEnd }}
      />
    </div>
  );
}
