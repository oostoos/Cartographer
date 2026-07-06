/** The only sanctioned way an emoji appears in this app's UI, in place of an icon font/SVG set.
 * Pairs every emoji with an accessible label so screen readers announce its meaning rather than
 * reading the raw character. See CLAUDE.md in this directory.
 *
 * Inputs: symbol, the emoji character(s) to display; label, what it means (read by screen
 * readers, and shown as a tooltip).
 */
type EmojiIconProps = {
  symbol: string;
  label: string;
};

export function EmojiIcon({ symbol, label }: EmojiIconProps) {
  return (
    <span role="img" aria-label={label} title={label}>
      {symbol}
    </span>
  );
}
