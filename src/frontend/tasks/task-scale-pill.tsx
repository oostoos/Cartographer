import { IconButton } from "@lib-stack/design-language/icon-button";
import { CloseIcon } from "@lib-stack/design-language/icons";
import { SegmentedScale } from "@lib-stack/design-language/segmented-scale";

import "./task-scale-pill.css";

import { TASK_SCALE_MAXIMUM } from "./task-field-bounds";

const REMOVE_ICON_SIZE_PX = 12;

export interface ITaskScalePillProps {
  label: string;
  value: number;
  onChange: (value: number | null) => void;
}

/** Small pill showing a task's 1-5 scale field (energy/impact), adjustable inline. */
export function TaskScalePill({ label, value, onChange }: ITaskScalePillProps) {
  return (
    <span className="task-scale-pill">
      <span className="task-scale-pill__label">{label}</span>
      <SegmentedScale segmentCount={TASK_SCALE_MAXIMUM} value={value} onChange={onChange} aria-label={label} />
      <IconButton
        aria-label={`Clear ${label.toLowerCase()}`}
        className="task-scale-pill__clear"
        onClick={() => onChange(null)}
      >
        <CloseIcon size={REMOVE_ICON_SIZE_PX} />
      </IconButton>
    </span>
  );
}
