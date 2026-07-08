// @manualReviewRequested: 2026-07-07
import { type FormEvent, useState } from "react";

import { BasicIcon } from "../../core/design-system/components/BasicIcon";
import { Button } from "../../core/design-system/components/Button";
import { Field } from "../../core/design-system/components/Field";
import { ModalButton } from "../../core/design-system/components/ModalButton";
import { TextInput } from "../../core/design-system/components/TextInput";
import { WorkspaceColorPicker } from "./WorkspaceColorPicker";
import { useCreateWorkspace } from "./useWorkspaces";
import "./WorkspaceCreateModal.css";

type WorkspaceCreateModalProps = {
  onCreated?: (workspaceId: string) => void;
};

/** The standard "New workspace" trigger + modal, icon-only to match every other create button
 * (Task/Project/Block) — see app/tasks/TaskCreateModal.tsx.
 */
export function WorkspaceCreateModal({ onCreated }: WorkspaceCreateModalProps) {
  const createWorkspace = useCreateWorkspace();

  return (
    <ModalButton
      label="New workspace"
      icon={<BasicIcon name="plus" label="New workspace" />}
      iconOnly
      renderContent={(close) => (
        <WorkspaceCreateForm
          onCreate={(title, color) =>
            createWorkspace.mutate(
              { title, color },
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

type WorkspaceCreateFormProps = {
  onCreate: (title: string, color: string) => void;
};

function WorkspaceCreateForm({ onCreate }: WorkspaceCreateFormProps) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState("1");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    onCreate(title, color);
    setTitle("");
  }

  return (
    <form className="cg-workspace-create-form" onSubmit={handleSubmit}>
      <TextInput
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Workspace name"
        autoFocus
      />
      <Field label="Color">
        <WorkspaceColorPicker value={color} onChange={setColor} />
      </Field>
      <Button type="submit">
        Add workspace <BasicIcon name="plus" label="Add" />
      </Button>
    </form>
  );
}
