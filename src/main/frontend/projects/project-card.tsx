import { useDroppable } from "@dnd-kit/core";

import { Card } from "@common/design-language/card";
import { IconButton } from "@common/design-language/icon-button";
import { TrashIcon } from "@common/design-language/icons";

import "./project-card.css";

import { buildProjectDropId } from "../tasks/compute-drag-outcome";
import type { TProject } from "./types";

export interface IProjectCardProps {
  project: TProject;
  completedCount: number;
  totalCount: number;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

/** A project in the sidebar's project list: selects it as the active filter when clicked,
 * and accepts a dropped task to assign it to this project. */
export function ProjectCard({ project, completedCount, totalCount, isActive, onSelect, onDelete }: IProjectCardProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: buildProjectDropId(project.id),
    data: { type: "project", projectId: project.id },
  });

  return (
    <div ref={setNodeRef} data-drop-active={isOver}>
      <Card>
        <div className="project-card" data-active={isActive}>
          <button type="button" className="project-card__select" onClick={onSelect}>
            <span className="project-card__name">{project.name}</span>
            <span className="project-card__count">
              {completedCount}/{totalCount}
            </span>
          </button>
          <IconButton aria-label={`Delete ${project.name}`} onClick={onDelete}>
            <TrashIcon />
          </IconButton>
        </div>
      </Card>
    </div>
  );
}
