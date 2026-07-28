import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

import "./icon-button.css";

export type TIconButtonVariant = "default" | "danger" | "additive";

export interface IIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon-only buttons have no visible label, so an accessible name is required. */
  "aria-label": string;
  variant?: TIconButtonVariant;
}

/** Small, square, low-emphasis button for icon-only actions (e.g. closing a panel). Defaults to the neutral "default" variant. */
export const IconButton = forwardRef<HTMLButtonElement, IIconButtonProps>(function IconButton(
  { variant = "default", className, ...rest },
  ref,
) {
  const variantClassName = variant !== "default" ? `icon-button--${variant}` : null;
  const classNames = ["icon-button", variantClassName, className].filter(Boolean).join(" ");
  return <button ref={ref} type="button" className={classNames} {...rest} />;
});
