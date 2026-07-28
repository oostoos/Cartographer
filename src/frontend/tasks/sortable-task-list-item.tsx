import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { IconButton } from "@lib-stack/design-language/icon-button";
import { GripIcon } from "@lib-stack/design-language/icons";

import "./sortable-task-list-item.css";

import { TaskListItem } from "./task-list-item";
import type { TTask } from "./types";

export interface ISortableTaskListItemProps {
  task: TTask;
  onToggleCompleted: (completed: boolean) => void;
  groupName?: string | null;
  onRemoveGroup?: () => void;
  onSetEnergyRequirement?: (value: number | null) => void;
  onSetImpact?: (value: number | null) => void;
  onSetDueDate?: (value: string | null) => void;
  onSetTimeEstimateMinutes?: (value: number | null) => void;
  onDelete?: () => void;
}

/** A TaskListItem draggable within its list, for reordering active tasks and for
 * dragging onto a group card in the sidebar to assign it. */
export function SortableTaskListItem({
  task,
  onToggleCompleted,
  groupName,
  onRemoveGroup,
  onSetEnergyRequirement,
  onSetImpact,
  onSetDueDate,
  onSetTimeEstimateMinutes,
  onDelete,
}: ISortableTaskListItemProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li ref={setNodeRef} style={style} className="sortable-task-list-item" data-dragging={isDragging}>
      <TaskListItem
        task={task}
        onToggleCompleted={onToggleCompleted}
        groupName={groupName}
        onRemoveGroup={onRemoveGroup}
        onSetEnergyRequirement={onSetEnergyRequirement}
        onSetImpact={onSetImpact}
        onSetDueDate={onSetDueDate}
        onSetTimeEstimateMinutes={onSetTimeEstimateMinutes}
        onDelete={onDelete}
        dragHandle={
          <IconButton
            ref={setActivatorNodeRef}
            className="task-list-item__drag-handle"
            aria-label={`Reorder "${task.title}"`}
            {...attributes}
            {...listeners}
          >
            <GripIcon />
          </IconButton>
        }
      />
    </li>
  );
}
