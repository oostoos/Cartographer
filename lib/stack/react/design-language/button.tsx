import type { ButtonHTMLAttributes } from "react";

import "./button.css";

export type TButtonVariant = "primary" | "secondary" | "danger" | "additive";

export interface IButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: TButtonVariant;
}

/** Styled button matching Cartographer's design language. Defaults to the "primary" variant. */
export function Button({ variant = "primary", className, ...rest }: IButtonProps) {
  const classNames = ["button", `button--${variant}`, className].filter(Boolean).join(" ");
  return <button className={classNames} {...rest} />;
}
