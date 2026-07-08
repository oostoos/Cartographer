// @manualReviewRequested: 2026-07-06
import { useEffect, useRef, useState, type ReactNode } from "react";

import { BasicIcon } from "./BasicIcon";
import "./MasterDetailLayout.css";

/** Matches this file's own CSS transition duration — how long the detail panel's close animation
 * takes, so its content stays mounted for exactly that long before actually unmounting.
 */
const CLOSE_TRANSITION_MS = 250;

type MasterDetailLayoutProps = {
  list: ReactNode;
  /** null means nothing is selected — the list renders alone, centered. */
  detail: ReactNode | null;
  onCloseDetail: () => void;
};

/** The standard "list, centered alone until something is selected, then slides into a 50/50
 * split with a detail panel" shell shared by the Tasks and Projects pages. Owns the detail
 * panel's close (X) button itself, so callers' own detail components (TaskDetailPane,
 * ProjectDetailPane) need no changes to compose with it — closing always means "clear the
 * selection back to the centered, alone state," a different action from any in-panel navigation
 * (e.g. a project's own breadcrumb), which only ever changes what's selected, never clears it.
 */
export function MasterDetailLayout({ list, detail, onCloseDetail }: MasterDetailLayoutProps) {
  const [renderedDetail, setRenderedDetail] = useState<ReactNode | null>(detail);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (detail !== null) {
      setRenderedDetail(detail);
      return;
    }
    // Closing: keep the previous content mounted while the panel animates down to nothing,
    // then actually clear it once the CSS transition has finished.
    closeTimeoutRef.current = setTimeout(() => setRenderedDetail(null), CLOSE_TRANSITION_MS);
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, [detail]);

  const isSplit = detail !== null;

  return (
    <div className={`cg-master-detail${isSplit ? " cg-master-detail--split" : ""}`}>
      <div className="cg-master-detail__list">{list}</div>
      <div className="cg-master-detail__detail">
        {renderedDetail && (
          <>
            <button
              type="button"
              className="cg-master-detail__close"
              aria-label="Close"
              onClick={onCloseDetail}
            >
              <BasicIcon name="close" label="Close" />
            </button>
            {renderedDetail}
          </>
        )}
      </div>
    </div>
  );
}
