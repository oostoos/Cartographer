import "./initials-chip.css";

export interface IInitialsChipProps {
  initials: string;
}

/** Small circular chip showing a person's initials, e.g. a profile avatar placeholder. */
export function InitialsChip({ initials }: IInitialsChipProps) {
  return <span className="initials-chip">{initials}</span>;
}
