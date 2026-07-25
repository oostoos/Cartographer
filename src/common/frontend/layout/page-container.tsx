import type { ReactNode } from "react";

import "./page-container.css";

export interface IPageContainerProps {
  children: ReactNode;
}

/** Centers and constrains a page's content, with mobile-friendly padding. Single source of truth for page layout. */
export function PageContainer({ children }: IPageContainerProps) {
  return <main className="page-container">{children}</main>;
}
