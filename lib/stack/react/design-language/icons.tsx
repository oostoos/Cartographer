import type { ReactNode } from "react";

export interface IIconProps {
  className?: string;
  size?: number;
}

const DEFAULT_ICON_SIZE_PX = 16;
const ICON_VIEWBOX_SIZE = 24;
const ICON_VIEWBOX = `0 0 ${ICON_VIEWBOX_SIZE} ${ICON_VIEWBOX_SIZE}`;
const ICON_STROKE_WIDTH = 2;

interface IIconSvgProps extends IIconProps {
  children: ReactNode;
}

/** Shared icon scaffold: every icon in this file is this same `<svg>` wrapper around a differing shape. */
function IconSvg({ className, size = DEFAULT_ICON_SIZE_PX, children }: IIconSvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={ICON_VIEWBOX}
      fill="none"
      stroke="currentColor"
      strokeWidth={ICON_STROKE_WIDTH}
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

/** "-" icon, e.g. for a decrement button. */
export function MinusIcon(props: IIconProps) {
  return (
    <IconSvg {...props}>
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

/** Pencil icon, e.g. for a rename button. */
export function PencilIcon(props: IIconProps) {
  return (
    <IconSvg {...props}>
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </IconSvg>
  );
}

/** Trash-can icon, e.g. for a delete-group button. */
export function TrashIcon(props: IIconProps) {
  return (
    <IconSvg {...props}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </IconSvg>
  );
}
