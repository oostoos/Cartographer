import type { ButtonHTMLAttributes } from "react";

import "./Button.css";

type ButtonVariant = "primary" | "secondary" | "danger";
type ButtonEmphasis = "solid" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  /** "ghost" (an outline plus a light tint of the variant's color) is the default look
   * everywhere for now — pass "solid" for the fully-colored look where ghost reads as too quiet.
   */
  emphasis?: ButtonEmphasis;
  /** Renders as a square, label-less button for inline list actions. Callers must still supply
   * an aria-label (or wrap an EmojiIcon with one) since there's no visible text for assistive
   * tech to read.
   */
  iconOnly?: boolean;
};

/** The one button style used everywhere in the app, so a visual change happens in one place. */
export function Button({
  variant = "primary",
  emphasis = "ghost",
  iconOnly = false,
  className,
  ...rest
}: ButtonProps) {
  const classes = [
    "cg-button",
    `cg-button--${variant}`,
    `cg-button--${emphasis}`,
    iconOnly ? "cg-button--icon-only" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <button className={classes} {...rest} />;
}
