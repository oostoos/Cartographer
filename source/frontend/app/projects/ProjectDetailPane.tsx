import { useEffect, useState } from "react";

import { Button } from "../../core/design-system/components/Button";
import { Card } from "../../core/design-system/components/Card";
import { Checkbox } from "../../core/design-system/components/Checkbox";
import { EmojiIcon } from "../../core/design-system/components/EmojiIcon";
import { TextArea } from "../../core/design-system/components/TextArea";
import { TextInput } from "../../core/design-system/components/TextInput";
import { NotesSection } from "../journals/NotesSection";
import { TaskCreateModal } from "../tasks/TaskCreateModal";
import { useTasks } from "../tasks/useTasks";
import { ProjectCreateModal } from "./ProjectCreateModal";
import type { Project } from "./projectApi";
import { useDeleteProject, useProjects, useUpdateProject } from "./useProjects";
import "./ProjectDetailPane.css";

const NO_PARENT_VALUE = "";
const DELETE_CHILDREN_OPTION_VALUE = "";

type ProjectDetailPaneProps = {
  project: Project;
  onSelectProject: (projectId: string) => void;
  onDeleted: () => void;
};

/** Recursively collects every descendant (children, grandchildren, ...) of a project, so the
 * parent-reassignment and move-children-to selects never offer a choice that would create a
 * cycle in the project tree.
 */
function collectDescendantIds(projectId: string, allProjects: Project[]): Set<string> {
  const descendantIds = new Set<string>();
  const stack = [projectId];
  while (stack.length > 0) {
    const currentId = stack.pop() as string;
    for (const candidate of allProjects) {
      if (candidate.parentProjectId === currentId && !descendantIds.has(candidate.id)) {
        descendantIds.add(candidate.id);
        stack.push(candidate.id);
      }
    }
  }
  return descendantIds;
}

/** Shows and edits one project: a title with its subprojects and tasks nested beneath it, a
 * small description-plus-notes section, and a settings area (parent project, archived) ending
 * in Save changes / Delete project.
 */
export function ProjectDetailPane({ project, onSelectProject, onDeleted }: ProjectDetailPaneProps) {
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const { data: tasksInProject } = useTasks(project.id);
  const { data: allProjects } = useProjects();

  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description);
  const [parentProjectId, setParentProjectId] = useState(project.parentProjectId);
  const [isArchived, setIsArchived] = useState(project.isArchived);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [moveTargetProjectId, setMoveTargetProjectId] = useState(DELETE_CHILDREN_OPTION_VALUE);

  useEffect(() => {
    setTitle(project.title);
    setDescription(project.description);
    setParentProjectId(project.parentProjectId);
    setIsArchived(project.isArchived);
    setIsConfirmingDelete(false);
  }, [project]);

  function handleSave() {
    updateProject.mutate({
      projectId: project.id,
      changes: { title, description, parentProjectId, isArchived },
    });
  }

  const subprojects = (allProjects ?? []).filter(
    (candidate) => candidate.parentProjectId === project.id,
  );
  const parentProject = (allProjects ?? []).find(
    (candidate) => candidate.id === project.parentProjectId,
  );
  const ineligibleParentIds = new Set([
    project.id,
    ...collectDescendantIds(project.id, allProjects ?? []),
  ]);
  const eligibleParents = (allProjects ?? []).filter(
    (candidate) => !ineligibleParentIds.has(candidate.id),
  );

  function handleDeleteClick() {
    if ((tasksInProject?.length ?? 0) > 0 || subprojects.length > 0) {
      setIsConfirmingDelete(true);
      return;
    }
    deleteProject.mutate({ projectId: project.id }, { onSuccess: onDeleted });
  }

  function handleConfirmDelete() {
    deleteProject.mutate(
      {
        projectId: project.id,
        moveChildrenToProjectId: moveTargetProjectId || undefined,
      },
      { onSuccess: onDeleted },
    );
  }

  return (
    <div className="cg-project-detail-pane">
      {parentProject && (
        <button
          type="button"
          className="cg-project-detail-pane__breadcrumb"
          onClick={() => onSelectProject(parentProject.id)}
        >
          ← Back to {parentProject.title}
        </button>
      )}

      <Card>
        <TextInput
          className="cg-project-detail-pane__title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          aria-label="Title"
        />
      </Card>

      <Card>
        <div className="cg-project-detail-pane__section-header">
          <h3>
            Subprojects <EmojiIcon symbol="📁" label="Subprojects" />
          </h3>
          <ProjectCreateModal initialParentProjectId={project.id} onCreated={onSelectProject} />
        </div>
        {subprojects.length === 0 && <p>No subprojects yet.</p>}
        <ul className="cg-project-detail-pane__subproject-list">
          {subprojects.map((subproject) => (
            <li key={subproject.id}>
              <button type="button" onClick={() => onSelectProject(subproject.id)}>
                {subproject.title}
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <div className="cg-project-detail-pane__section-header">
          <h3>
            Tasks in this project <EmojiIcon symbol="✅" label="Tasks" />
          </h3>
          <TaskCreateModal initialProjectId={project.id} />
        </div>
        {tasksInProject?.length === 0 && <p>No tasks in this project yet.</p>}
        <ul className="cg-project-detail-pane__task-list">
          {tasksInProject?.map((taskItem) => (
            <li key={taskItem.id}>{taskItem.title}</li>
          ))}
        </ul>
      </Card>

      <Card>
        <label className="cg-project-detail-pane__field">
          Description
          <TextArea
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <NotesSection targetType="Project" targetId={project.id} />
      </Card>

      <Card>
        <h3>
          Settings <EmojiIcon symbol="⚙️" label="Settings" />
        </h3>
        <label className="cg-project-detail-pane__field">
          Parent project
          <select
            value={parentProjectId}
            onChange={(event) => setParentProjectId(event.target.value)}
          >
            <option value={NO_PARENT_VALUE}>No parent (top-level)</option>
            {eligibleParents.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.title}
              </option>
            ))}
          </select>
        </label>
        <p className="cg-project-detail-pane__meta">
          Created {new Date(project.createdAt).toLocaleDateString()}
        </p>
        <Checkbox
          checked={isArchived}
          onToggle={() => setIsArchived(!isArchived)}
          label="Archived"
        />
        <div className="cg-project-detail-pane__actions">
          <Button type="button" onClick={handleSave}>
            Save changes
          </Button>
          {!isConfirmingDelete && (
            <Button type="button" variant="danger" onClick={handleDeleteClick}>
              Delete project <EmojiIcon symbol="🗑️" label="Delete" />
            </Button>
          )}
        </div>
        {isConfirmingDelete && (
          <div className="cg-project-detail-pane__confirm-delete">
            <p>
              This project has {tasksInProject?.length ?? 0} task
              {tasksInProject?.length === 1 ? "" : "s"} and {subprojects.length} subproject
              {subprojects.length === 1 ? "" : "s"}. What should happen to them?
            </p>
            <label className="cg-project-detail-pane__field">
              <select
                value={moveTargetProjectId}
                onChange={(event) => setMoveTargetProjectId(event.target.value)}
              >
                <option value={DELETE_CHILDREN_OPTION_VALUE}>Delete them all</option>
                {eligibleParents.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    Move to "{candidate.title}"
                  </option>
                ))}
              </select>
            </label>
            <div className="cg-project-detail-pane__actions">
              <Button type="button" variant="danger" onClick={handleConfirmDelete}>
                Confirm
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsConfirmingDelete(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
