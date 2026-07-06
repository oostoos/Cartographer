import { Checkbox } from "../../core/design-system/components/Checkbox";
import type { Task } from "./taskApi";
import "./TaskRow.css";

/** A task's title, struck-through and muted once complete — the same idiom SubtaskList uses for
 * a resolved subtask. Exported on its own so Sidebar's renderItemLabel (Tasks list) and
 * TaskRow's own flat-list rendering (Today page) can share the exact same styling.
 */
export function TaskTitle({ task }: { task: Task }) {
  return (
    <span className={task.isComplete ? "cg-task-row__title--resolved" : undefined}>
      {task.title}
    </span>
  );
}

type TaskRowProps = {
  task: Task;
  onToggleComplete: (isComplete: boolean) => void;
};

/** A task rendered as a checkbox plus its title, for a flat (non-sidebar) list — the Today
 * page's sections. The Tasks list sidebar instead renders the checkbox and title as separate
 * siblings via Sidebar's renderLeading/renderItemLabel, since nesting a checkbox inside
 * Sidebar's selectable row button isn't valid markup.
 */
export function TaskRow({ task, onToggleComplete }: TaskRowProps) {
  const toggleLabel = `Mark "${task.title}" ${task.isComplete ? "incomplete" : "complete"}`;

  return (
    <div className="cg-task-row">
      <Checkbox
        checked={task.isComplete}
        onToggle={() => onToggleComplete(!task.isComplete)}
        label={toggleLabel}
      />
      <TaskTitle task={task} />
    </div>
  );
}
