import type { ReactNode } from "react";

import { Card } from "@lib-stack/design-language/card";
import { IconButton } from "@lib-stack/design-language/icon-button";
import { TrashIcon } from "@lib-stack/design-language/icons";
import { Link, useLocation } from "react-router-dom";

import "./task-list-item.css";

import { formatCompletionLabel } from "./format-completion-label";
import { TaskGroupPill } from "./task-group-pill";
import type { TTask } from "./types";

export interface ITaskListItemProps {
  task: TTask;
  onToggleCompleted: (completed: boolean) => void;
  /** Optional drag handle rendered at the start of the row, e.g. for drag-to-reorder. */
  dragHandle?: ReactNode;
  /** Name of the group this task belongs to, if any. Resolved by the parent from the id. */
  groupName?: string | null;
  /** Called when the group pill's remove button is clicked. Required whenever groupName is set. */
  onRemoveGroup?: () => void;
  /** Called when the row's delete button is clicked. Omit to hide the delete button. */
  onDelete?: () => void;
}

/** A single row in the task list: checkbox + title, linking through to the task's detail page. */
export function TaskListItem({
  task,
  onToggleCompleted,
  dragHandle,
  groupName,
  onRemoveGroup,
  onDelete,
}: ITaskListItemProps) {
  const location = useLocation();

  return (
    <Card>
      <div className="task-list-item" data-completed={task.completed}>
        {dragHandle}
        <input
          type="checkbox"
          checked={task.completed}
          onChange={(event) => onToggleCompleted(event.target.checked)}
          aria-label={`Mark "${task.title}" as ${task.completed ? "not completed" : "completed"}`}
        />
        <div className="task-list-item__content">
          {/* Preserves the active ?group= filter so opening a task's details doesn't reset it to "All tasks". */}
          <Link to={{ pathname: `/tasks/${task.id}`, search: location.search }}>{task.title}</Link>
          {groupName && onRemoveGroup && (
            <TaskGroupPill groupName={groupName} onRemove={onRemoveGroup} />
          )}
        </div>
        {task.completed && task.completed_at && (
          <span className="task-list-item__completed-at">{formatCompletionLabel(task.completed_at)}</span>
        )}
        {onDelete && (
          <IconButton aria-label={`Delete "${task.title}"`} className="task-list-item__delete" onClick={onDelete}>
            <TrashIcon />
          </IconButton>
        )}
      </div>
    </Card>
  );
}
