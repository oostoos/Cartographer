import { IconButton } from "@common/design-language/icon-button";
import { CloseIcon } from "@common/design-language/icons";

import "./task-project-pill.css";

const REMOVE_ICON_SIZE_PX = 12;

export interface ITaskProjectPillProps {
  projectName: string;
  onRemove: () => void;
}

/** Small pill showing which project a task belongs to, with a button to unassign it. */
export function TaskProjectPill({ projectName, onRemove }: ITaskProjectPillProps) {
  return (
    <span className="task-project-pill">
      {projectName}
      <IconButton
        aria-label={`Remove from ${projectName}`}
        className="task-project-pill__remove"
        onClick={onRemove}
      >
        <CloseIcon size={REMOVE_ICON_SIZE_PX} />
      </IconButton>
    </span>
  );
}
