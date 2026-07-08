// @manualReviewRequested: 2026-07-06
import type { ButtonHTMLAttributes } from "react";

import { BasicIcon } from "./BasicIcon";
import "./DragHandle.css";

type DragHandleProps = ButtonHTMLAttributes<HTMLButtonElement>;

/** The one drag-handle button used by every reorderable list (Tasks sidebar's Ad-hoc group, the
 * Recurring Tasks management page) — a caller spreads dnd-kit's own `attributes`/`listeners` onto
 * it exactly as it would onto a bare button.
 */
export function DragHandle({ className, ...rest }: DragHandleProps) {
  const classes = ["cg-drag-handle", className].filter(Boolean).join(" ");
  return (
    <button type="button" className={classes} aria-label="Reorder" {...rest}>
      <BasicIcon name="grip" label="Drag to reorder" />
    </button>
  );
}
