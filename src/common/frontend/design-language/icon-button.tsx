import type { ButtonHTMLAttributes } from "react";

import "./icon-button.css";

export interface IIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon-only buttons have no visible label, so an accessible name is required. */
  "aria-label": string;
}

/** Small, square, low-emphasis button for icon-only actions (e.g. closing a panel). */
export function IconButton({ className, ...rest }: IIconButtonProps) {
  const classNames = ["icon-button", className].filter(Boolean).join(" ");
  return <button type="button" className={classNames} {...rest} />;
}
