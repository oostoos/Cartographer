import type { CSSProperties, ReactNode } from "react";

import "./card.css";

export interface ICardProps {
  children: ReactNode;
  /** Escape hatch for a caller-supplied per-instance background (e.g. a color tied to the
   * record being shown), overriding the default token-driven surface color. */
  style?: CSSProperties;
}

/** A surface-colored, shadowed container used throughout the app for grouped content. */
export function Card({ children, style }: ICardProps) {
  return (
    <div className="card" style={style}>
      {children}
    </div>
  );
}
