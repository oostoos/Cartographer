// @manualReviewRequested: 2026-07-06
import { useEffect, useRef, useState } from "react";

import { BasicIcon } from "./BasicIcon";
import "./Select.css";

export type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
};

/** A custom-rendered dropdown (trigger button + an absolutely-positioned options popup) rather
 * than a restyled native `<select>`, so the open options list matches the app's look too, not
 * just the closed box. Focus stays on the trigger the whole time — arrow keys move an internal
 * highlight, Enter/Space commits it, Escape or an outside click closes without changing `value` —
 * rather than moving focus into the popup, avoiding a full roving-tabindex listbox.
 */
export function Select({
  value,
  onChange,
  options,
  placeholder,
  className,
  "aria-label": ariaLabel,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  useEffect(() => {
    if (!isOpen) return;

    function handleOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  function openAt(index: number) {
    setHighlightedIndex(Math.max(0, Math.min(index, options.length - 1)));
    setIsOpen(true);
  }

  function commitHighlighted() {
    const option = options[highlightedIndex];
    if (option) onChange(option.value);
    setIsOpen(false);
  }

  function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (!isOpen) {
      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        openAt(selectedIndex >= 0 ? selectedIndex : 0);
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((previous) => Math.min(previous + 1, options.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((previous) => Math.max(previous - 1, 0));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      commitHighlighted();
    } else if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
    }
  }

  const classes = ["cg-select", className].filter(Boolean).join(" ");

  return (
    <div className={classes} ref={containerRef}>
      <button
        type="button"
        className="cg-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        onClick={() => (isOpen ? setIsOpen(false) : openAt(selectedIndex >= 0 ? selectedIndex : 0))}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="cg-select__value">
          {selectedOption ? selectedOption.label : (placeholder ?? "")}
        </span>
        <span aria-hidden="true">
          <BasicIcon name="chevron-down" label="Toggle options" />
        </span>
      </button>
      {isOpen && (
        <ul className="cg-select__popup" role="listbox">
          {options.map((option, index) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              className={[
                "cg-select__option",
                option.value === value ? "cg-select__option--selected" : "",
                index === highlightedIndex ? "cg-select__option--highlighted" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onMouseEnter={() => setHighlightedIndex(index)}
              onClick={(event) => {
                // Without this, a click here (a non-labelable descendant of Field's <label>)
                // triggers the browser's native label-click-forwarding onto the trigger button
                // (the label's first labelable descendant), reopening the popup we just closed.
                event.preventDefault();
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
