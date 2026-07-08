// @manualReviewRequested: 2026-07-06
import { type FormEvent, useState } from "react";

import { BasicIcon } from "../../core/design-system/components/BasicIcon";
import { Button } from "../../core/design-system/components/Button";
import { Field } from "../../core/design-system/components/Field";
import { ModalButton } from "../../core/design-system/components/ModalButton";
import { Select } from "../../core/design-system/components/Select";
import { TextInput } from "../../core/design-system/components/TextInput";
import { useWorkspaces } from "../workspaces/useWorkspaces";
import { useCreateProject } from "./useProjects";
import "./ProjectCreateModal.css";

type ProjectCreateModalProps = {
  /** When given, the new project is created as a subproject of this one — used for "new
   * subproject" inside a project's own detail pane.
   */
  initialParentProjectId?: string;
  onCreated?: (projectId: string) => void;
  className?: string;
  /** Forwarded to ModalButton so a caller (e.g. an Alt+Shift+N shortcut) can open this modal
   * externally instead of only via its own trigger button — omit to keep the default,
   * self-contained open/close state.
   */
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
};

/** The standard "New project" trigger + modal. Reused by the top-level Projects page and by a
 * project's detail pane so both surfaces create projects through the exact same control.
 */
export function ProjectCreateModal({
  initialParentProjectId,
  onCreated,
  className,
  isOpen,
  onOpenChange,
}: ProjectCreateModalProps) {
  const createProject = useCreateProject();
  const { data: workspaces } = useWorkspaces();

  return (
    <ModalButton
      label={initialParentProjectId ? "New subproject" : "New project"}
      icon={<BasicIcon name="plus" label="New project" />}
      iconOnly
      className={className}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      renderContent={(close) => (
        <ProjectCreateForm
          workspaces={workspaces ?? []}
          onCreate={(title, workspaceId) =>
            createProject.mutate(
              { title, parentProjectId: initialParentProjectId, workspaceId },
              {
                onSuccess: (created) => {
                  onCreated?.(created.id);
                  close();
                },
              },
            )
          }
        />
      )}
    />
  );
}

type ProjectCreateFormProps = {
  workspaces: { id: string; title: string }[];
  onCreate: (title: string, workspaceId: string) => void;
};

const NO_WORKSPACE_VALUE = "";

function ProjectCreateForm({ workspaces, onCreate }: ProjectCreateFormProps) {
  const [title, setTitle] = useState("");
  const [workspaceId, setWorkspaceId] = useState(NO_WORKSPACE_VALUE);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    onCreate(title, workspaceId);
    setTitle("");
    setWorkspaceId(NO_WORKSPACE_VALUE);
  }

  return (
    <form className="cg-project-create-form" onSubmit={handleSubmit}>
      <TextInput
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="New project name"
        autoFocus
      />
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
        Add project <BasicIcon name="plus" label="Add" />
      </Button>
    </form>
  );
}
