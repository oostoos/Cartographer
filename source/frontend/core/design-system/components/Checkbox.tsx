// @manualReviewRequested: 2026-07-06
import { BasicIcon } from "./BasicIcon";
import "./Checkbox.css";

type CheckboxProps = {
  checked: boolean;
  onToggle: () => void;
  label: string;
};

/** A checkbox rendered as a tappable traced icon rather than a native checkbox input, matching
 * the app's button-icon idiom.
 */
export function Checkbox({ checked, onToggle, label }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      className="cg-checkbox"
      onClick={onToggle}
    >
      <BasicIcon name={checked ? "check" : "empty-square"} label={label} />
    </button>
  );
}
