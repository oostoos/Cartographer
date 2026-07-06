import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { Card } from "./Card";
import { EmojiIcon } from "./EmojiIcon";
import "./Modal.css";

type ModalProps = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

/** A centered overlay dialog, portaled to document.body, closing on Escape or a backdrop click —
 * the standard shell every create/edit flow in the app should use instead of an inline page swap.
 */
export function Modal({ isOpen, title, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    dialogRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="cg-modal__backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        className="cg-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <Card className="cg-modal__card">
          <div className="cg-modal__header">
            <h2 className="cg-modal__title">{title}</h2>
            <button type="button" className="cg-modal__close" aria-label="Close" onClick={onClose}>
              <EmojiIcon symbol="✖️" label="Close" />
            </button>
          </div>
          {children}
        </Card>
      </div>
    </div>,
    document.body,
  );
}
