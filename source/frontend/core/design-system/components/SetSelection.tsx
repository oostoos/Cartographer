// @manualReviewRequested: 2026-07-07
import "./SetSelection.css";

export type SetSelectionOption = {
  value: string;
  label: string;
};

type SingleSetSelectionProps = {
  multiple?: false;
  value: string;
  onChange: (value: string) => void;
  options: SetSelectionOption[];
  "aria-label"?: string;
};

type MultiSetSelectionProps = {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
  options: SetSelectionOption[];
  "aria-label"?: string;
};

type SetSelectionProps = SingleSetSelectionProps | MultiSetSelectionProps;

/** A pill-list choice control — an alternative to `Select` for a short list of options where
 * every choice can stay visible at once instead of hidden behind a dropdown. Single-select mode
 * (the default) behaves like a styled radio group — exactly one pill is always active, clicking
 * a pill selects it, and there is no way to deselect down to nothing. Multi-select mode
 * (`multiple`) behaves like a row of independent toggle buttons — clicking a pill toggles it on
 * or off regardless of any other pill's state.
 */
export function SetSelection(props: SetSelectionProps) {
  const { options, "aria-label": ariaLabel } = props;

  if (props.multiple) {
    const { value, onChange } = props;
    function toggle(optionValue: string) {
      if (value.includes(optionValue))
        onChange(value.filter((selected) => selected !== optionValue));
      else onChange([...value, optionValue]);
    }
    return (
      <div className="cg-set-selection" role="group" aria-label={ariaLabel}>
        {options.map((option) => {
          const isSelected = value.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              className={`cg-set-selection__pill${
                isSelected ? " cg-set-selection__pill--selected" : ""
              }`}
              aria-pressed={isSelected}
              onClick={() => toggle(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }

  const { value, onChange } = props;
  return (
    <div className="cg-set-selection" role="radiogroup" aria-label={ariaLabel}>
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={`cg-set-selection__pill${
              isSelected ? " cg-set-selection__pill--selected" : ""
            }`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
