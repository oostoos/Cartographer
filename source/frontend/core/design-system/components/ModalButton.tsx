// @manualReviewRequested: 2026-07-06
import { useState, type ReactNode } from "react";

import { Button } from "./Button";
import { Modal } from "./Modal";

type ButtonVariant = "primary" | "secondary" | "danger";
type ButtonEmphasis = "solid" | "ghost";

type ModalButtonProps = {
  label: string;
  /** The modal's heading, if it should differ from the trigger button's label. */
  title?: string;
  icon?: ReactNode;
  variant?: ButtonVariant;
  emphasis?: ButtonEmphasis;
  iconOnly?: boolean;
  className?: string;
  /** Renders the modal's body. Receives a close callback so content (e.g. a form) can dismiss
   * the modal itself after a successful save, without the caller managing open state.
   */
  renderContent: (close: () => void) => ReactNode;
  /** Controls the modal's open state externally (e.g. a keyboard shortcut opening it) instead of
   * ModalButton's own internal state — omit both to keep the default, self-contained behavior.
   */
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
};

/** The standard "trigger button + modal" idiom used by every create/edit-in-a-modal flow in the
 * app: owns its own open/close state so callers only describe the trigger and the modal's
 * content, unless a caller opts into controlling that state itself via isOpen/onOpenChange.
 */
export function ModalButton({
  label,
  title,
  icon,
  variant = "primary",
  emphasis = "ghost",
  iconOnly = false,
  className,
  renderContent,
  isOpen,
  onOpenChange,
}: ModalButtonProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const open = isOpen ?? internalIsOpen;
  const setOpen = onOpenChange ?? setInternalIsOpen;

  return (
    <>
      <Button
        type="button"
        variant={variant}
        emphasis={emphasis}
        iconOnly={iconOnly}
        aria-label={iconOnly ? label : undefined}
        className={className}
        onClick={() => setOpen(true)}
      >
        {iconOnly ? (
          icon
        ) : (
          <>
            {label}
            {icon}
          </>
        )}
      </Button>
      <Modal isOpen={open} title={title ?? label} onClose={() => setOpen(false)}>
        {renderContent(() => setOpen(false))}
      </Modal>
    </>
  );
}
