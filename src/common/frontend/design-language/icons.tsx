import type { ReactNode } from "react";

export interface IIconProps {
  className?: string;
  size?: number;
}

const DEFAULT_ICON_SIZE_PX = 16;

interface IIconSvgProps extends IIconProps {
  children: ReactNode;
}

/** Shared icon scaffold: every icon in this file is this same `<svg>` wrapper around a differing shape. */
function IconSvg({ className, size = DEFAULT_ICON_SIZE_PX, children }: IIconSvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

/** "+" icon, e.g. for the add-task button. */
export function PlusIcon(props: IIconProps) {
  return (
    <IconSvg {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </IconSvg>
  );
}

/** "x" icon, e.g. for a close button. */
export function CloseIcon(props: IIconProps) {
  return (
    <IconSvg {...props}>
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </IconSvg>
  );
}

/** Downward chevron icon, e.g. for a disclosure toggle. */
export function ChevronDownIcon(props: IIconProps) {
  return (
    <IconSvg {...props}>
      <polyline points="6 9 12 15 18 9" />
    </IconSvg>
  );
}

/** Vertical six-dot grip icon, e.g. for a drag handle. */
export function GripIcon(props: IIconProps) {
  return (
    <IconSvg {...props}>
      <circle cx="9" cy="6" r="1" />
      <circle cx="15" cy="6" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="9" cy="18" r="1" />
      <circle cx="15" cy="18" r="1" />
    </IconSvg>
  );
}
