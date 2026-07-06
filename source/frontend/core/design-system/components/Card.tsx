import type { HTMLAttributes } from "react";

import "./Card.css";

type CardProps = HTMLAttributes<HTMLDivElement>;

/** A soft, rounded surface used for every grouped block of content (journal entries, forms,
 * list rows) so the whole app shares one "container" look.
 */
export function Card({ className, ...rest }: CardProps) {
  const classes = ["cg-card", className].filter(Boolean).join(" ");
  return <div className={classes} {...rest} />;
}
