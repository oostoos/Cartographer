// @manualReviewRequested: 2026-07-07
import { useMemo } from "react";

import { BasicIcon } from "../../core/design-system/components/BasicIcon";
import { Button } from "../../core/design-system/components/Button";
import { Checkbox } from "../../core/design-system/components/Checkbox";
import {
  List,
  type ListGroup,
  type ListReorderConfig,
} from "../../core/design-system/components/List";
import { TaskSkipButton, TaskTitle } from "./TaskRow";
import type { Task } from "./taskApi";
import { useDeleteTask, useUpdateTask } from "./useTasks";

const ACTIVE_GROUP_KEY = "active";
const COMPLETED_GROUP_KEY = "completed";
const ALL_GROUP_KEY = "all";

export type TaskListCapabilities = {
  /** Whether a leading Checkbox toggles completion — default true. */
  allowComplete?: boolean;
  /** Whether a trailing Delete button renders — default false, since only some surfaces (e.g. a
   * task's own subtask checklist) allow deleting a row outright.
   */
  allowDelete?: boolean;
  /** Whether a row is clickable via onSelectTask at all — default true. Skip is still driven
   * per-row by task.isSkippable regardless of this setting, matching how every task list already
   * shows Skip independently of navigation.
   */
  allowEdit?: boolean;
};

type TaskListProps = {
  tasks: Task[];
  isLoading?: boolean;
  selectedTaskId?: string | null;
  onSelectTask?: (taskId: string) => void;
  capabilities?: TaskListCapabilities;
  /** An always-present bottom quick-add row — when given, no emptyMessage ever renders alongside
   * it (the input row itself is the empty state).
   */
  newItemLine?: { placeholder: string; ariaLabel?: string; onCreateItem: (title: string) => void };
  /** Shown when the list has no newItemLine and no items — ignored whenever newItemLine is set. */
  emptyMessage?: string;
  /** Splits tasks into an active group and a collapsed "Completed (n)" group (active sorted by
   * order, completed sorted by completedAt descending) instead of rendering every task as one
   * flat group in the order given.
   */
  completedGroup?: boolean;
  /** The flat group's key when completedGroup is false — only matters to a caller that also
   * passes reorderable, whose own groupKey must match this one for List to treat the right group
   * as sortable. Defaults to "all" when the caller has no reorderable config of its own.
   */
  groupKey?: string;
  /** Passed straight through to List for a caller (e.g. a drag-and-drop subtask checklist) that
   * already owns its own reorder state — TaskList itself never reorders tasks.
   */
  reorderable?: ListReorderConfig;
};

/** The one task-row-rendering control every task list in the app builds on — Checkbox/Skip/
 * Delete/click-to-edit are each independently opt-in via capabilities, so a calendar sidebar, a
 * project's task list, and a task's own subtask checklist can each show only the actions that
 * make sense for them while sharing one implementation. Wraps the generic List primitive
 * (core/design-system/components/List.tsx); owns its own complete/skip/delete mutations
 * internally so callers never wire that plumbing themselves.
 */
export function TaskList({
  tasks,
  isLoading = false,
  selectedTaskId = null,
  onSelectTask,
  capabilities,
  newItemLine,
  emptyMessage,
  completedGroup = false,
  groupKey = ALL_GROUP_KEY,
  reorderable,
}: TaskListProps) {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const allowComplete = capabilities?.allowComplete ?? true;
  const allowDelete = capabilities?.allowDelete ?? false;
  const allowEdit = capabilities?.allowEdit ?? true;

  const groups: ListGroup<Task>[] = useMemo(() => {
    if (!completedGroup) {
      return [{ key: groupKey, items: tasks, newItemLine }];
    }
    const activeTasks = tasks.filter((task) => !task.isComplete).sort((a, b) => a.order - b.order);
    const completedTasks = tasks
      .filter((task) => task.isComplete)
      .sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || ""));
    return [
      { key: ACTIVE_GROUP_KEY, items: activeTasks, newItemLine },
      {
        key: COMPLETED_GROUP_KEY,
        items: completedTasks,
        collapsible: { defaultExpanded: false, summaryLabel: (count) => `Completed (${count})` },
      },
    ];
  }, [tasks, newItemLine, completedGroup, groupKey]);

  return (
    <List
      groups={groups}
      getId={(task) => task.id}
      getLabel={(task) => task.title}
      renderItemLabel={(task) => <TaskTitle task={task} />}
      renderLeading={
        allowComplete
          ? (task) => (
              <Checkbox
                checked={task.isComplete}
                onToggle={() =>
                  updateTask.mutate({ taskId: task.id, changes: { isComplete: !task.isComplete } })
                }
                label={`Mark "${task.title}" ${task.isComplete ? "incomplete" : "complete"}`}
              />
            )
          : undefined
      }
      renderTrailing={(task) => (
        <>
          {task.isSkippable && (
            <TaskSkipButton
              task={task}
              onToggleSkip={(isSkipped) =>
                updateTask.mutate({ taskId: task.id, changes: { isSkipped } })
              }
            />
          )}
          {allowDelete && (
            <Button
              iconOnly
              variant="danger"
              onClick={() => deleteTask.mutate(task.id)}
              aria-label={`Delete ${task.title}`}
            >
              <BasicIcon name="trash" label="Delete" />
            </Button>
          )}
        </>
      )}
      selectedId={selectedTaskId}
      onSelect={allowEdit ? onSelectTask : undefined}
      emptyMessage={newItemLine ? undefined : isLoading ? "Loading tasks…" : emptyMessage}
      reorderable={reorderable}
    />
  );
}
