// @manualReviewRequested: 2026-07-06
import { forwardRef, type InputHTMLAttributes } from "react";

import "./TextInput.css";

type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

/** The one text input style used everywhere in the app. */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { className, ...rest },
  ref,
) {
  const classes = ["cg-text-input", className].filter(Boolean).join(" ");
  return <input ref={ref} className={classes} {...rest} />;
});
