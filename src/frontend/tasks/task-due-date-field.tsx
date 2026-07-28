import "./task-due-date-field.css";

import { formatDueDateLabel } from "./format-due-date-label";

export interface ITaskDueDateFieldProps {
  value: string | null;
  /** Omit to render a read-only formatted date instead of the native date input. */
  onChange?: (value: string | null) => void;
  "aria-label": string;
}

/** A task's due date. A native date input (clearable via its own browser-provided clear
 * control) when onChange is given, a plain read-only formatted label when it's omitted. */
export function TaskDueDateField({ value, onChange, "aria-label": ariaLabel }: ITaskDueDateFieldProps) {
  if (!onChange) {
    return (
      <span className="task-due-date-field task-due-date-field--read-only" aria-label={ariaLabel}>
        {value !== null ? formatDueDateLabel(value) : null}
      </span>
    );
  }

  return (
    <input
      type="date"
      className="task-due-date-field"
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value || null)}
      aria-label={ariaLabel}
    />
  );
}
