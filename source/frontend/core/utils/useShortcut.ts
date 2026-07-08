// @manualReviewRequested: 2026-07-06
import { useEffect } from "react";

type ShortcutKey = {
  /** A single letter/digit, matched case-insensitively (e.g. "N"). */
  key: string;
  alt: boolean;
  shift: boolean;
};

/** The one reusable keyboard-shortcut primitive for the app — every shortcut is Alt+Shift+
 * something, matching this shape, so a new shortcut is always registered the same way instead of
 * a one-off keydown listener per page. Attaches/detaches a single document-level listener for the
 * lifetime of the calling component.
 */
export function useShortcut({ key, alt, shift }: ShortcutKey, callback: () => void) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.altKey === alt &&
        event.shiftKey === shift &&
        event.key.toUpperCase() === key.toUpperCase()
      ) {
        event.preventDefault();
        callback();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [key, alt, shift, callback]);
}
