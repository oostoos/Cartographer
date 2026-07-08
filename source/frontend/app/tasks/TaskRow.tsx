// @manualReviewRequested: 2026-07-06
import { BasicIcon } from "../../core/design-system/components/BasicIcon";
import { Button } from "../../core/design-system/components/Button";
import { Checkbox } from "../../core/design-system/components/Checkbox";
import { EmojiIcon } from "../../core/design-system/components/EmojiIcon";
import { formatCompletedAt } from "./taskFormat";
import type { Task } from "./taskApi";
import "./TaskRow.css";

/** A task's title, plus whatever else belongs right next to it: an archived badge, a completed
 * or skipped resolution style (completed is struck-through and muted, matching the same idiom
 * SubtaskList uses for a resolved subtask; skipped is italic and muted, with no strikethrough,
 * so the two resolutions read as visually distinct), a subtask-progress badge when this task has
 * any subtasks, and a completed-at label (time if completed today, date otherwise) once
 * complete. Exported on its own so Sidebar's renderItemLabel (Tasks list) and TaskRow's own
 * flat-list rendering (Today page) can share the exact same styling. An archived task's badge is
 * safe to render unconditionally here since an archived task never reaches TaskRow's Today-page
 * usage (today_engine excludes it), so this only ever shows up on the Tasks page's sidebar.
 */
export function TaskTitle({ task }: { task: Task }) {
  const resolutionClass = task.isComplete
    ? "cg-task-row__title--completed"
    : task.isSkipped
      ? "cg-task-row__title--skipped"
      : undefined;
  return (
    <span className={resolutionClass}>
      {task.isArchived && <EmojiIcon symbol="🗄️" label="Archived" />} {task.title}
      {task.subtaskCount && task.subtaskCount.total > 0 && (
        <span className="cg-task-row__subtask-count">
          {" "}
          ({task.subtaskCount.completed}/{task.subtaskCount.total})
        </span>
      )}
      {task.isComplete && task.completedAt && (
        <span className="cg-task-row__completed-at"> · {formatCompletedAt(task.completedAt)}</span>
      )}
    </span>
  );
}

/** The Skip/Unskip icon-only button shared by every task list's trailing slot — the Today page's
 * flat TaskRow, the Tasks page sidebar's flat groups and Projects tree rows, and a project's own
 * task list — so a task's skip control is one implementation rendered in the same position
 * everywhere it appears. Only ever rendered by callers when task.isSkippable is true.
 */
export function TaskSkipButton({
  task,
  onToggleSkip,
}: {
  task: Task;
  onToggleSkip: (isSkipped: boolean) => void;
}) {
  const skipLabel = `${task.isSkipped ? "Unskip" : "Skip"} "${task.title}"`;
  return (
    <Button
      iconOnly
      variant="secondary"
      onClick={() => onToggleSkip(!task.isSkipped)}
      aria-label={skipLabel}
    >
      <BasicIcon name={task.isSkipped ? "undo" : "skip-forward"} label={skipLabel} />
    </Button>
  );
}

type TaskRowProps = {
  task: Task;
  onToggleComplete: (isComplete: boolean) => void;
  /** Toggles isSkipped — omit to hide the Skip control entirely (e.g. a context where skipping
   * doesn't make sense). The control itself only ever renders when task.isSkippable is true.
   */
  onToggleSkip?: (isSkipped: boolean) => void;
  /** When given, the title becomes a clickable button navigating elsewhere (e.g. the Today
   * page's recurring list linking into the Tasks page) — omitted everywhere else, where the
   * title is inert text.
   */
  onTitleClick?: () => void;
};

/** A task rendered as a checkbox plus its title, for a flat (non-sidebar) list — the Today
 * page's sections. The Tasks list sidebar instead renders the checkbox and title as separate
 * siblings via Sidebar's renderLeading/renderItemLabel, since nesting a checkbox inside
 * Sidebar's selectable row button isn't valid markup.
 */
export function TaskRow({ task, onToggleComplete, onToggleSkip, onTitleClick }: TaskRowProps) {
  const toggleLabel = `Mark "${task.title}" ${task.isComplete ? "incomplete" : "complete"}`;

  return (
    <div className="cg-task-row">
      <Checkbox
        checked={task.isComplete}
        onToggle={() => onToggleComplete(!task.isComplete)}
        label={toggleLabel}
      />
      <span className="cg-task-row__title">
        {onTitleClick ? (
          <button type="button" className="cg-task-row__title-button" onClick={onTitleClick}>
            <TaskTitle task={task} />
          </button>
        ) : (
          <TaskTitle task={task} />
        )}
      </span>
      {task.isSkippable && onToggleSkip && (
        <TaskSkipButton task={task} onToggleSkip={onToggleSkip} />
      )}
    </div>
  );
}
