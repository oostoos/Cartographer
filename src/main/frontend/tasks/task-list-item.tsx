import type { ReactNode } from "react";

import { Card } from "@common/design-language/card";
import { Link } from "react-router-dom";

import "./task-list-item.css";

import { formatCompletionLabel } from "./format-completion-label";
import { TaskProjectPill } from "./task-project-pill";
import type { TTask } from "./types";

export interface ITaskListItemProps {
  task: TTask;
  onToggleCompleted: (completed: boolean) => void;
  /** Optional drag handle rendered at the start of the row, e.g. for drag-to-reorder. */
  dragHandle?: ReactNode;
  /** Name of the project this task belongs to, if any. Resolved by the parent from the id. */
  projectName?: string | null;
  /** Called when the project pill's remove button is clicked. Required whenever projectName is set. */
  onRemoveProject?: () => void;
}

/** A single row in the task list: checkbox + title, linking through to the task's detail page. */
export function TaskListItem({
  task,
  onToggleCompleted,
  dragHandle,
  projectName,
  onRemoveProject,
}: ITaskListItemProps) {
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
        <Link to={`/tasks/${task.id}`}>{task.title}</Link>
        {projectName && onRemoveProject && (
          <TaskProjectPill projectName={projectName} onRemove={onRemoveProject} />
        )}
        {task.completed && task.completed_at && (
          <span className="task-list-item__completed-at">{formatCompletionLabel(task.completed_at)}</span>
        )}
      </div>
    </Card>
  );
}
