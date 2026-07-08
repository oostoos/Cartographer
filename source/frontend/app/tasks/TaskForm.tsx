// @manualReviewRequested: 2026-07-07
import { type FormEvent, useState } from "react";

import { BasicIcon } from "../../core/design-system/components/BasicIcon";
import { Button } from "../../core/design-system/components/Button";
import { Field } from "../../core/design-system/components/Field";
import { Select } from "../../core/design-system/components/Select";
import { TextInput } from "../../core/design-system/components/TextInput";
import type { CreateTaskInput } from "./taskApi";
import "./TaskForm.css";

type ProjectOption = {
  id: string;
  title: string;
};

type WorkspaceOption = {
  id: string;
  title: string;
};

type TaskFormProps = {
  projects: ProjectOption[];
  workspaces?: WorkspaceOption[];
  /** When given, the task is created directly in this project and the project field is hidden
   * rather than left editable — used when creating a task from within a project's own detail
   * pane.
   */
  initialProjectId?: string;
  onCreate: (input: CreateTaskInput) => void;
};

const NO_PROJECT_VALUE = "";
const NO_WORKSPACE_VALUE = "";

/** The form for adding a new one-off task, including its optional project and workspace.
 * Recurrence is no longer set from here — a task only ever recurs by being nested inside a block
 * template (see app/blocks/CLAUDE.md's BlockTemplatesPage), not via a per-task setting at
 * creation time.
 */
export function TaskForm({ projects, workspaces = [], initialProjectId, onCreate }: TaskFormProps) {
  const isProjectLocked = initialProjectId !== undefined;
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(initialProjectId ?? NO_PROJECT_VALUE);
  const [workspaceId, setWorkspaceId] = useState(NO_WORKSPACE_VALUE);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;

    onCreate({ title, projectId, workspaceId });

    setTitle("");
    setProjectId(initialProjectId ?? NO_PROJECT_VALUE);
    setWorkspaceId(NO_WORKSPACE_VALUE);
  }

  return (
    <form className="cg-task-form" onSubmit={handleSubmit}>
      <Field label="Title">
        <TextInput value={title} onChange={(event) => setTitle(event.target.value)} autoFocus />
      </Field>

      {!isProjectLocked && projects.length > 0 && (
        <Field label="Project">
          <Select
            value={projectId}
            onChange={setProjectId}
            options={[
              { value: NO_PROJECT_VALUE, label: "No project" },
              ...projects.map((project) => ({ value: project.id, label: project.title })),
            ]}
          />
        </Field>
      )}

      {workspaces.length > 0 && (
        <Field label="Workspace">
          <Select
            value={workspaceId}
            onChange={setWorkspaceId}
            options={[
              { value: NO_WORKSPACE_VALUE, label: "No workspace" },
              ...workspaces.map((workspace) => ({ value: workspace.id, label: workspace.title })),
            ]}
          />
        </Field>
      )}

      <Button type="submit">
        Add task <BasicIcon name="plus" label="Add" />
      </Button>
    </form>
  );
}
