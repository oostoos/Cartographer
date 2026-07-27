import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

import "./icon-button.css";

export interface IIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon-only buttons have no visible label, so an accessible name is required. */
  "aria-label": string;
}

/** Small, square, low-emphasis button for icon-only actions (e.g. closing a panel). */
export const IconButton = forwardRef<HTMLButtonElement, IIconButtonProps>(function IconButton(
  { className, ...rest },
  ref,
) {
  const classNames = ["icon-button", className].filter(Boolean).join(" ");
  return <button ref={ref} type="button" className={classNames} {...rest} />;
});
