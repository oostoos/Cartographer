// @manualReviewRequested: 2026-07-07
import { Checkbox } from "./Checkbox";
import "./CheckboxField.css";

type CheckboxFieldProps = {
  label: string;
  checked: boolean;
  onToggle: () => void;
  /** An optional tooltip (native title attribute) clarifying what the control actually does, for
   * a control whose effect isn't obvious from its label alone.
   */
  title?: string;
};

/** A checkbox with its label sitting beside it (not stacked above it, like Field renders) — the
 * standard shape for a boolean settings toggle (e.g. Archived, Skippable) so the box and its
 * caption read as one control instead of two disjoint pieces.
 */
export function CheckboxField({ label, checked, onToggle, title }: CheckboxFieldProps) {
  return (
    <label className="cg-checkbox-field" title={title}>
      <Checkbox checked={checked} onToggle={onToggle} label={label} />
      {label}
    </label>
  );
}
