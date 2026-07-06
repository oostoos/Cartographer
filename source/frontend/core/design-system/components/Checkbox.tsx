import { EmojiIcon } from "./EmojiIcon";
import "./Checkbox.css";

type CheckboxProps = {
  checked: boolean;
  onToggle: () => void;
  label: string;
};

const CHECKED_SYMBOL = "✅";
const UNCHECKED_SYMBOL = "⬜";

/** A checkbox rendered as a tappable emoji, per the app's emoji-in-place-of-icons style, rather
 * than a native checkbox input.
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
      <EmojiIcon symbol={checked ? CHECKED_SYMBOL : UNCHECKED_SYMBOL} label={label} />
    </button>
  );
}
