// @manualReviewRequested: 2026-07-06
import "./BasicIcon.css";

export type BasicIconName =
  | "plus"
  | "trash"
  | "skip-forward"
  | "undo"
  | "close"
  | "grip"
  | "check"
  | "empty-square"
  | "pencil"
  | "copy"
  | "chevron-down"
  | "chevron-left"
  | "chevron-right";

/** The only sanctioned way a traced (non-emoji) icon appears in this app's UI — used for
 * interactive controls (buttons, drag handles, the checkbox) so they read as distinct from the
 * "fun emoji" decoration `EmojiIcon` provides for headings and other non-interactive spots. See
 * CLAUDE.md in this directory.
 *
 * Inputs: name, which traced glyph to draw; label, what it means (read by screen readers, and
 * shown as a tooltip) — same accessible-label contract as `EmojiIcon`.
 */
type BasicIconProps = {
  name: BasicIconName;
  label: string;
};

const ICON_PATHS: Record<BasicIconName, JSX.Element> = {
  plus: <path d="M12 5v14M5 12h14" />,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />,
  "skip-forward": <path d="M6 5l10 7-10 7V5zM18 5v14" />,
  undo: <path d="M8 7L4 11l4 4M4 11h11a5 5 0 0 1 0 10h-2" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  grip: (
    <>
      <circle cx="9" cy="6" r="1.4" />
      <circle cx="15" cy="6" r="1.4" />
      <circle cx="9" cy="12" r="1.4" />
      <circle cx="15" cy="12" r="1.4" />
      <circle cx="9" cy="18" r="1.4" />
      <circle cx="15" cy="18" r="1.4" />
    </>
  ),
  check: <path d="M5 12l5 5 9-11" />,
  "empty-square": <rect x="5" y="5" width="14" height="14" rx="2" />,
  pencil: <path d="M4 20l1-5 11-11 4 4-11 11-5 1zM14 5l4 4" />,
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </>
  ),
  "chevron-down": <path d="M6 9l6 6 6-6" />,
  "chevron-left": <path d="M15 6l-6 6 6 6" />,
  "chevron-right": <path d="M9 6l6 6-6 6" />,
};

export function BasicIcon({ name, label }: BasicIconProps) {
  return (
    <span role="img" aria-label={label} title={label} className="cg-basic-icon">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {ICON_PATHS[name]}
      </svg>
    </span>
  );
}
