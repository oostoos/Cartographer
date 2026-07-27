import type { ReactNode } from "react";

import "./card.css";

export interface ICardProps {
  children: ReactNode;
}

/** A surface-colored, shadowed container used throughout the app for grouped content. */
export function Card({ children }: ICardProps) {
  return <div className="card">{children}</div>;
}
