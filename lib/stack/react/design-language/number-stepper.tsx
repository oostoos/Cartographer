import { IconButton } from "./icon-button";
import { MinusIcon, PlusIcon } from "./icons";
import "./number-stepper.css";

const UNSET_DISPLAY_PLACEHOLDER = "—";

export interface INumberStepperProps {
  value: number | null;
  step: number;
  /** Floor the value can't go below; decrementing past it clears to null. Defaults to step. */
  minimum?: number;
  onChange: (value: number | null) => void;
  /** Formats a non-null value for display. Defaults to String(value). */
  formatValue?: (value: number) => string;
  "aria-label": string;
}

/** A -/+ stepper over an optional int, moving by a fixed step. Decrementing below the
 * minimum clears the value to null rather than going negative. */
export function NumberStepper({
  value,
  step,
  minimum = step,
  onChange,
  formatValue = String,
  "aria-label": ariaLabel,
}: INumberStepperProps) {
  function handleIncrement() {
    onChange(value === null ? minimum : value + step);
  }

  function handleDecrement() {
    if (value === null) return;
    onChange(value - step < minimum ? null : value - step);
  }

  return (
    <div className="number-stepper" role="group" aria-label={ariaLabel}>
      <IconButton aria-label={`Decrease ${ariaLabel}`} onClick={handleDecrement} disabled={value === null}>
        <MinusIcon />
      </IconButton>
      <span className="number-stepper__value">
        {value !== null ? formatValue(value) : UNSET_DISPLAY_PLACEHOLDER}
      </span>
      <IconButton aria-label={`Increase ${ariaLabel}`} onClick={handleIncrement}>
        <PlusIcon />
      </IconButton>
    </div>
  );
}
