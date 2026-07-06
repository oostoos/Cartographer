import type { InputHTMLAttributes } from "react";

import "./TextInput.css";

type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

/** The one text input style used everywhere in the app. */
export function TextInput({ className, ...rest }: TextInputProps) {
  const classes = ["cg-text-input", className].filter(Boolean).join(" ");
  return <input className={classes} {...rest} />;
}
