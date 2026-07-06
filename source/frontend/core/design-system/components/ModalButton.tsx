import { useState, type ReactNode } from "react";

import { Button } from "./Button";
import { EmojiIcon } from "./EmojiIcon";
import { Modal } from "./Modal";

type ButtonVariant = "primary" | "secondary" | "danger";
type ButtonEmphasis = "solid" | "ghost";

type ModalButtonProps = {
  label: string;
  /** The modal's heading, if it should differ from the trigger button's label. */
  title?: string;
  icon?: { symbol: string; label: string };
  variant?: ButtonVariant;
  emphasis?: ButtonEmphasis;
  iconOnly?: boolean;
  className?: string;
  /** Renders the modal's body. Receives a close callback so content (e.g. a form) can dismiss
   * the modal itself after a successful save, without the caller managing open state.
   */
  renderContent: (close: () => void) => ReactNode;
};

/** The standard "trigger button + modal" idiom used by every create/edit-in-a-modal flow in the
 * app: owns its own open/close state so callers only describe the trigger and the modal's
 * content.
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
}: ModalButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        emphasis={emphasis}
        iconOnly={iconOnly}
        aria-label={iconOnly ? label : undefined}
        className={className}
        onClick={() => setIsOpen(true)}
      >
        {iconOnly ? (
          icon && <EmojiIcon symbol={icon.symbol} label={icon.label} />
        ) : (
          <>
            {label}
            {icon && <EmojiIcon symbol={icon.symbol} label={icon.label} />}
          </>
        )}
      </Button>
      <Modal isOpen={isOpen} title={title ?? label} onClose={() => setIsOpen(false)}>
        {renderContent(() => setIsOpen(false))}
      </Modal>
    </>
  );
}
