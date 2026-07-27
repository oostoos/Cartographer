import type { ReactNode } from "react";

import "./page-container.css";

export interface IPageContainerProps {
  children: ReactNode;
  /** Drops the centered max-width constraint so content spans the full viewport width, e.g. for a multi-column page layout. */
  fullWidth?: boolean;
}

/** Centers and constrains a page's content, with mobile-friendly padding. Single source of truth for page layout. */
export function PageContainer({ children, fullWidth }: IPageContainerProps) {
  const className = `page-container${fullWidth ? " page-container--full-width" : ""}`;
  return <main className={className}>{children}</main>;
}
