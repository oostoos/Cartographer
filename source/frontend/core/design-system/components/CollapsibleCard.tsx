// @manualReviewRequested: 2026-07-07
import { useState, type ReactNode } from "react";

import { Card } from "./Card";
import { EmojiIcon } from "./EmojiIcon";
import "./CollapsibleCard.css";

type CollapsibleCardProps = {
  title: string;
  icon: { symbol: string; label: string };
  defaultExpanded?: boolean;
  /** Renders after the header's toggle button (e.g. a "+ New" button) — a sibling, never nested
   * inside the toggle, same never-nested-interactive-controls rule List/Sidebar already follow.
   */
  headerActions?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** A Card that collapses behind its own header toggle — the calendar page's left sidebar uses one
 * per section (Blocks/Tasks/Projects) so a user can tuck away whichever they don't need right now.
 * Same "▾/▸ toggle" idiom List's own collapsible groups use, generalized to wrap arbitrary content
 * rather than only list rows.
 */
export function CollapsibleCard({
  title,
  icon,
  defaultExpanded = true,
  headerActions,
  children,
  className,
}: CollapsibleCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const classes = ["cg-collapsible-card", className].filter(Boolean).join(" ");

  return (
    <Card className={classes}>
      <div className="cg-collapsible-card__header">
        <button
          type="button"
          className="cg-collapsible-card__toggle"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((previous) => !previous)}
        >
          <EmojiIcon symbol={isExpanded ? "▾" : "▸"} label={isExpanded ? "Collapse" : "Expand"} />
          <span className="cg-collapsible-card__title">
            {title} <EmojiIcon symbol={icon.symbol} label={icon.label} />
          </span>
        </button>
        {headerActions && <div className="cg-collapsible-card__actions">{headerActions}</div>}
      </div>
      {isExpanded && <div className="cg-collapsible-card__body">{children}</div>}
    </Card>
  );
}
