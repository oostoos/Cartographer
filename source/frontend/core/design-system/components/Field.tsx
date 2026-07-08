// @manualReviewRequested: 2026-07-06
import type { ReactNode } from "react";

import "./Field.css";

type FieldProps = {
  label: string;
  children: ReactNode;
  className?: string;
  /** An optional tooltip (native title attribute) clarifying what the field's control actually
   * does, for a control whose effect isn't obvious from its label alone.
   */
  title?: string;
};

/** The one "label wraps a control" style used everywhere in the app — implicit label-text-node
 * association (no htmlFor/id pairing), matching how every existing field already worked. Composes
 * with any control (TextInput, TextArea, Select, or a Checkbox that wants visible label text).
 */
export function Field({ label, children, className, title }: FieldProps) {
  const classes = ["cg-field", className].filter(Boolean).join(" ");
  return (
    <label className={classes} title={title}>
      {label}
      {children}
    </label>
  );
}
