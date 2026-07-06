// @manualReviewRequested: 2026-07-06
import { type FormEvent, useState } from "react";

import { Button } from "../../core/design-system/components/Button";
import { EmojiIcon } from "../../core/design-system/components/EmojiIcon";
import { ModalButton } from "../../core/design-system/components/ModalButton";
import { TextInput } from "../../core/design-system/components/TextInput";
import { useCreateProject } from "./useProjects";
import "./ProjectCreateModal.css";

type ProjectCreateModalProps = {
  /** When given, the new project is created as a subproject of this one — used for "new
   * subproject" inside a project's own detail pane.
   */
  initialParentProjectId?: string;
  onCreated?: (projectId: string) => void;
  className?: string;
};

/** The standard "New project" trigger + modal. Reused by the top-level Projects page and by a
 * project's detail pane so both surfaces create projects through the exact same control.
 */
export function ProjectCreateModal({
  initialParentProjectId,
  onCreated,
  className,
}: ProjectCreateModalProps) {
  const createProject = useCreateProject();

  return (
    <ModalButton
      label={initialParentProjectId ? "New subproject" : "New project"}
      icon={{ symbol: "➕", label: "New project" }}
      className={className}
      renderContent={(close) => (
        <ProjectCreateForm
          onCreate={(title) =>
            createProject.mutate(
              { title, parentProjectId: initialParentProjectId },
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
  onCreate: (title: string) => void;
};

function ProjectCreateForm({ onCreate }: ProjectCreateFormProps) {
  const [title, setTitle] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    onCreate(title);
    setTitle("");
  }

  return (
    <form className="cg-project-create-form" onSubmit={handleSubmit}>
      <TextInput
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="New project name"
        autoFocus
      />
      <Button type="submit">
        Add project <EmojiIcon symbol="➕" label="Add" />
      </Button>
    </form>
  );
}
