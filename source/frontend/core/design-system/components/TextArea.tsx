// @manualReviewRequested: 2026-07-06
import type { TextareaHTMLAttributes } from "react";

import "./TextArea.css";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

/** The one multi-line text style used everywhere in the app, for fields like notes. */
export function TextArea({ className, ...rest }: TextAreaProps) {
  const classes = ["cg-text-area", className].filter(Boolean).join(" ");
  return <textarea className={classes} {...rest} />;
}
