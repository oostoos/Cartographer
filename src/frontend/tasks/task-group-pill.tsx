import { IconButton } from "@lib-stack/design-language/icon-button";
import { CloseIcon } from "@lib-stack/design-language/icons";

import "./task-group-pill.css";

const REMOVE_ICON_SIZE_PX = 12;

export interface ITaskGroupPillProps {
  groupName: string;
  onRemove: () => void;
}

/** Small pill showing which group a task belongs to, with a button to unassign it. */
export function TaskGroupPill({ groupName, onRemove }: ITaskGroupPillProps) {
  return (
    <span className="task-group-pill">
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
