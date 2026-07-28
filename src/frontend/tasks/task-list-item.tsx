import type { ReactNode } from "react";

import { Card } from "@lib-stack/design-language/card";
import { IconButton } from "@lib-stack/design-language/icon-button";
import { TrashIcon } from "@lib-stack/design-language/icons";
import { Link, useLocation } from "react-router-dom";

import "./task-list-item.css";

import { formatCompletionLabel } from "./format-completion-label";
import { TaskDueDateField } from "./task-due-date-field";
import { TaskGroupPill } from "./task-group-pill";
import { TaskScalePill } from "./task-scale-pill";
import { TaskTimeEstimatePill } from "./task-time-estimate-pill";
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
  /** Called when the energy control changes. Required whenever energy_requirement is set. */
  onSetEnergyRequirement?: (value: number | null) => void;
  /** Called when the impact control changes. Required whenever impact is set. */
  onSetImpact?: (value: number | null) => void;
  /** Called when the due date field changes. Required whenever due_date is set. */
  onSetDueDate?: (value: string | null) => void;
  /** Called when the time estimate stepper changes. Required whenever time_estimate_minutes is set. */
  onSetTimeEstimateMinutes?: (value: number | null) => void;
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
  onSetEnergyRequirement,
  onSetImpact,
  onSetDueDate,
  onSetTimeEstimateMinutes,
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
          <div className="task-list-item__meta-row">
            {groupName && onRemoveGroup && (
              <TaskGroupPill groupName={groupName} onRemove={onRemoveGroup} />
            )}
            {task.energy_requirement !== null && onSetEnergyRequirement && (
              <TaskScalePill label="Energy" value={task.energy_requirement} onChange={onSetEnergyRequirement} />
            )}
            {task.impact !== null && onSetImpact && (
              <TaskScalePill label="Impact" value={task.impact} onChange={onSetImpact} />
            )}
            {task.due_date !== null && onSetDueDate && (
              <TaskDueDateField
                value={task.due_date}
                onChange={onSetDueDate}
                aria-label={`"${task.title}" due date`}
              />
            )}
            {task.time_estimate_minutes !== null && onSetTimeEstimateMinutes && (
              <TaskTimeEstimatePill value={task.time_estimate_minutes} onChange={onSetTimeEstimateMinutes} />
            )}
          </div>
        </div>
        {task.completed && task.completed_at && (
          <span className="task-list-item__completed-at">{formatCompletionLabel(task.completed_at)}</span>
        )}
        {onDelete && (
          <IconButton
            variant="danger"
            aria-label={`Delete "${task.title}"`}
            className="task-list-item__delete"
            onClick={onDelete}
          >
            <TrashIcon />
          </IconButton>
        )}
      </div>
    </Card>
  );
}
