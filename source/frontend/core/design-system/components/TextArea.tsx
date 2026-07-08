// @manualReviewRequested: 2026-07-06
import { forwardRef, type TextareaHTMLAttributes } from "react";

import "./TextArea.css";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

/** The one multi-line text style used everywhere in the app, for fields like notes. */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { className, ...rest },
  ref,
) {
  const classes = ["cg-text-area", className].filter(Boolean).join(" ");
  return <textarea ref={ref} className={classes} {...rest} />;
});
