import { IconButton } from "@lib-stack/design-language/icon-button";
import { CloseIcon } from "@lib-stack/design-language/icons";

import "./task-group-pill.css";

const REMOVE_ICON_SIZE_PX = 12;

export interface ITaskGroupPillProps {
  groupName: string;
  groupColor: string;
  onRemove: () => void;
}

/** Small pill showing which group a task belongs to, tinted with the group's color, with a
 * button to unassign it. */
export function TaskGroupPill({ groupName, groupColor, onRemove }: ITaskGroupPillProps) {
  return (
    <span className="task-group-pill" style={{ backgroundColor: groupColor }}>
      {groupName}
      <IconButton
        aria-label={`Remove from ${groupName}`}
        className="task-group-pill__remove"
        onClick={onRemove}
      >
        <CloseIcon size={REMOVE_ICON_SIZE_PX} />
      </IconButton>
    </span>
  );
}
