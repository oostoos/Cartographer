import { useState } from "react";

import { ChevronDownIcon } from "@common/design-language/icons";

import "./completed-tasks-section.css";

import { TaskListItem } from "./task-list-item";
import type { TTask } from "./types";

export interface ICompletedTasksSectionProps {
  tasks: TTask[];
  onToggleCompleted: (taskId: string, completed: boolean) => void;
}

/** Collapsible "Completed" section for tasks completed on a prior day. Collapsed by default. */
export function CompletedTasksSection({ tasks, onToggleCompleted }: ICompletedTasksSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (tasks.length === 0) return null;

  return (
    <div className="completed-tasks-section">
      <button
        type="button"
        className="completed-tasks-section__header"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((current) => !current)}
      >
        <ChevronDownIcon
          className={`completed-tasks-section__chevron${isExpanded ? " completed-tasks-section__chevron--expanded" : ""}`}
        />
        Completed ({tasks.length})
      </button>

      {isExpanded && (
        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task.id}>
              <TaskListItem task={task} onToggleCompleted={(completed) => onToggleCompleted(task.id, completed)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
