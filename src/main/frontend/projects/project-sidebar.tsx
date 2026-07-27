import { useState } from "react";

import { Button } from "@common/design-language/button";
import { PlusIcon } from "@common/design-language/icons";
import { Modal } from "@common/design-language/modal";

import "./project-sidebar.css";

import type { TTaskFilter } from "../tasks/task-filter";
import type { TTask } from "../tasks/types";
import { computeProjectTaskCounts } from "./compute-project-task-counts";
import { ProjectCard } from "./project-card";
import { ProjectCreateForm } from "./project-create-form";
import type { TProject } from "./types";

export interface IProjectSidebarProps {
  projects: TProject[];
  tasks: TTask[];
  activeFilter: TTaskFilter;
  onSelectFilter: (filter: TTaskFilter) => void;
  onCreateProject: (name: string) => Promise<void>;
  onDeleteProject: (projectId: string) => void;
}

/** Left sidebar of the Tasks page: filter buttons plus the list of projects. */
export function ProjectSidebar({
  projects,
  tasks,
  activeFilter,
  onSelectFilter,
  onCreateProject,
  onDeleteProject,
}: IProjectSidebarProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  async function handleCreate(name: string) {
    await onCreateProject(name);
    setIsCreateModalOpen(false);
  }

  return (
    <div className="project-sidebar">
      <div className="project-sidebar__filters">
        <Button
          type="button"
          variant={activeFilter.type === "all" ? "primary" : "secondary"}
          onClick={() => onSelectFilter({ type: "all" })}
        >
          All tasks
        </Button>
        <Button
          type="button"
          variant={activeFilter.type === "no-project" ? "primary" : "secondary"}
          onClick={() => onSelectFilter({ type: "no-project" })}
        >
          No project
        </Button>
        <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(true)}>
          <PlusIcon /> New project
        </Button>
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="New project">
        <ProjectCreateForm onCreate={handleCreate} />
      </Modal>

      <ul className="project-sidebar__list">
        {projects.map((project) => {
          const counts = computeProjectTaskCounts(tasks, project.id);
          return (
            <li key={project.id}>
              <ProjectCard
                project={project}
                completedCount={counts.completed}
                totalCount={counts.total}
                isActive={activeFilter.type === "project" && activeFilter.projectId === project.id}
                onSelect={() => onSelectFilter({ type: "project", projectId: project.id })}
                onDelete={() => onDeleteProject(project.id)}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
