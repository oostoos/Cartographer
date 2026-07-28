import { NumberStepper } from "@lib-stack/design-language/number-stepper";

import "./task-time-estimate-pill.css";

import { formatTimeEstimateLabel } from "./format-time-estimate-label";
import { TASK_TIME_ESTIMATE_STEP_MINUTES } from "./task-field-bounds";

export interface ITaskTimeEstimatePillProps {
  /** null when unset — still renderable (showing the stepper's empty placeholder) when
   * onChange is given, so a value can be set for the first time. */
  value: number | null;
  /** Omit to render read-only plain text instead of the -/+ stepper. */
  onChange?: (value: number | null) => void;
}

/** Small pill showing a task's time estimate. Adjustable inline in 15-minute steps when
 * onChange is given (decrementing below one step clears it, so there's no separate clear
 * button), a plain read-only label when it's omitted. */
export function TaskTimeEstimatePill({ value, onChange }: ITaskTimeEstimatePillProps) {
  if (!onChange) {
    return <span className="task-time-estimate-pill">{value !== null ? formatTimeEstimateLabel(value) : null}</span>;
  }

  return (
    <span className="task-time-estimate-pill">
      <NumberStepper
        value={value}
        step={TASK_TIME_ESTIMATE_STEP_MINUTES}
        onChange={onChange}
        formatValue={formatTimeEstimateLabel}
        aria-label="Time estimate"
      />
    </span>
  );
}
