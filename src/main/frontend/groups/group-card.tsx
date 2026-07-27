import type { KeyboardEvent } from "react";
import { useState } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Card } from "@common/design-language/card";
import { IconButton } from "@common/design-language/icon-button";
import { GripIcon, PencilIcon, TrashIcon } from "@common/design-language/icons";

import "./group-card.css";

import type { TGroup } from "./types";

export interface IGroupCardProps {
  group: TGroup;
  completedCount: number;
  totalCount: number;
  isActive: boolean;
  onSelect: () => void;
  onRename: (name: string) => Promise<void>;
  onDelete: () => void;
}

/** A group in the sidebar's group list: selects it as the active filter when clicked,
 * accepts a dropped task to assign it to this group, and can be dragged to reorder or
 * renamed inline. */
export function GroupCard({
  group,
  completedCount,
  totalCount,
  isActive,
  onSelect,
  onRename,
  onDelete,
}: IGroupCardProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftName, setDraftName] = useState(group.name);

  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging, isOver } =
    useSortable({
      id: group.id,
      data: { type: "group", groupId: group.id },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function startRenaming() {
    setDraftName(group.name);
    setIsRenaming(true);
  }

  async function handleRenameSubmit() {
    setIsRenaming(false);
    const trimmedName = draftName.trim();
    if (!trimmedName || trimmedName === group.name) return;
    await onRename(trimmedName);
  }

  function handleRenameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    } else if (event.key === "Escape") {
      setDraftName(group.name);
      setIsRenaming(false);
    }
  }

  return (
    <div ref={setNodeRef} style={style} data-dragging={isDragging} data-drop-active={isOver}>
      <Card>
        <div className="group-card" data-active={isActive}>
          <IconButton
            ref={setActivatorNodeRef}
            className="group-card__drag-handle"
            aria-label={`Reorder ${group.name}`}
            {...attributes}
            {...listeners}
          >
            <GripIcon />
          </IconButton>

          {isRenaming ? (
            <input
              className="group-card__rename-input"
              value={draftName}
              autoFocus
              onChange={(event) => setDraftName(event.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={handleRenameKeyDown}
              aria-label={`Rename ${group.name}`}
            />
          ) : (
            <button type="button" className="group-card__select" onClick={onSelect}>
              <span className="group-card__name">{group.name}</span>
              <span className="group-card__count">
                {completedCount}/{totalCount}
              </span>
            </button>
          )}

          {!isRenaming && (
            <IconButton aria-label={`Rename ${group.name}`} onClick={startRenaming}>
              <PencilIcon />
            </IconButton>
          )}
          <IconButton aria-label={`Delete ${group.name}`} onClick={onDelete}>
            <TrashIcon />
          </IconButton>
        </div>
      </Card>
    </div>
  );
}
