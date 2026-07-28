import "./task-due-date-field.css";

export interface ITaskDueDateFieldProps {
  value: string | null;
  onChange: (value: string | null) => void;
  "aria-label": string;
}

/** A native date input for a task's due date, clearable via its own browser-provided clear control. */
export function TaskDueDateField({ value, onChange, "aria-label": ariaLabel }: ITaskDueDateFieldProps) {
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
