import { NumberStepper } from "@lib-stack/design-language/number-stepper";

import "./task-time-estimate-pill.css";

import { formatTimeEstimateLabel } from "./format-time-estimate-label";
import { TASK_TIME_ESTIMATE_STEP_MINUTES } from "./task-field-bounds";

export interface ITaskTimeEstimatePillProps {
  value: number;
  onChange: (value: number | null) => void;
}

/** Small pill showing a task's time estimate, adjustable inline in 15-minute steps.
 * Decrementing below one step clears the estimate, so there's no separate clear button. */
export function TaskTimeEstimatePill({ value, onChange }: ITaskTimeEstimatePillProps) {
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
