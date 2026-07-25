import { Card } from "@common/design-language/card";
import { Link } from "react-router-dom";

import "./task-list-item.css";

import type { TTask } from "./types";

export interface ITaskListItemProps {
  task: TTask;
  onToggleCompleted: (completed: boolean) => void;
}

/** A single row in the task list: checkbox + title, linking through to the task's detail page. */
export function TaskListItem({ task, onToggleCompleted }: ITaskListItemProps) {
  return (
    <Card>
      <div className="task-list-item" data-completed={task.completed}>
        <input
          type="checkbox"
          checked={task.completed}
          onChange={(event) => onToggleCompleted(event.target.checked)}
          aria-label={`Mark "${task.title}" as ${task.completed ? "not completed" : "completed"}`}
        />
        <Link to={`/tasks/${task.id}`}>{task.title}</Link>
      </div>
    </Card>
  );
}
