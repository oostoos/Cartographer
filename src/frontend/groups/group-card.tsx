import type { FocusEvent, KeyboardEvent } from "react";
import { useRef, useState } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Card } from "@lib-stack/design-language/card";
import { ColorSwatchPicker } from "@lib-stack/design-language/color-swatch-picker";
import { IconButton } from "@lib-stack/design-language/icon-button";
import { GripIcon, PencilIcon, TrashIcon } from "@lib-stack/design-language/icons";

import "./group-card.css";

import { GROUP_DROP_DATA_TYPE } from "../tasks/compute-drag-outcome";
import { GROUP_COLOR_PALETTE } from "./group-color-palette";
import type { TGroup } from "./types";

export interface IGroupCardProps {
  group: TGroup;
  completedCount: number;
  totalCount: number;
  isActive: boolean;
  onSelect: () => void;
  onRename: (name: string) => Promise<void>;
  onChangeColor: (color: string) => void;
  onDelete: () => void;
}

/** A group in the sidebar's group list: selects it as the active filter when clicked,
 * accepts a dropped task to assign it to this group, and can be dragged to reorder. Its
 * pencil button reveals inline controls to rename it and/or change its color. */
export function GroupCard({
  group,
  completedCount,
  totalCount,
  isActive,
  onSelect,
  onRename,
  onChangeColor,
  onDelete,
}: IGroupCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(group.name);
  const editContainerRef = useRef<HTMLDivElement>(null);

  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging, isOver } =
    useSortable({
      id: group.id,
      data: { type: GROUP_DROP_DATA_TYPE, groupId: group.id },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function startEditing() {
    setDraftName(group.name);
    setIsEditing(true);
  }

  async function handleRenameSubmit() {
    setIsEditing(false);
    const trimmedName = draftName.trim();
    if (!trimmedName || trimmedName === group.name) return;
    await onRename(trimmedName);
  }

  function handleEditBlur(event: FocusEvent<HTMLDivElement>) {
    // React's onBlur bubbles from any descendant (input or a color swatch). Only submit-and-close
    // once focus actually leaves the whole edit block — otherwise moving focus from the input to
    // a swatch (or vice versa) would close the block before the swatch's click could land.
    const nextFocusTarget = event.relatedTarget as Node | null;
    if (nextFocusTarget && editContainerRef.current?.contains(nextFocusTarget)) return;
    handleRenameSubmit();
  }

  function handleRenameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    } else if (event.key === "Escape") {
      setDraftName(group.name);
      setIsEditing(false);
    }
  }

  return (
    <div ref={setNodeRef} style={style} data-dragging={isDragging} data-drop-active={isOver}>
      <Card style={{ backgroundColor: group.color }}>
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

          {isEditing ? (
            <div className="group-card__edit" ref={editContainerRef} onBlur={handleEditBlur}>
              <input
                className="group-card__rename-input"
                value={draftName}
                autoFocus
                onChange={(event) => setDraftName(event.target.value)}
                onKeyDown={handleRenameKeyDown}
                aria-label={`Rename ${group.name}`}
              />
              <ColorSwatchPicker
                colors={GROUP_COLOR_PALETTE}
                value={group.color}
                onChange={onChangeColor}
                aria-label={`${group.name} color`}
              />
            </div>
          ) : (
            <button type="button" className="group-card__select" onClick={onSelect}>
              <span className="group-card__name">{group.name}</span>
              <span className="group-card__count">
                {completedCount}/{totalCount}
              </span>
            </button>
          )}

          {!isEditing && (
            <IconButton aria-label={`Edit ${group.name}`} onClick={startEditing}>
              <PencilIcon />
            </IconButton>
          )}
          <IconButton variant="danger" aria-label={`Delete ${group.name}`} onClick={onDelete}>
            <TrashIcon />
          </IconButton>
        </div>
      </Card>
    </div>
  );
}
