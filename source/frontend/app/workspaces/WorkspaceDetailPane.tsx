// @manualReviewRequested: 2026-07-07
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { BasicIcon } from "../../core/design-system/components/BasicIcon";
import { Button } from "../../core/design-system/components/Button";
import { Card } from "../../core/design-system/components/Card";
import { CheckboxField } from "../../core/design-system/components/CheckboxField";
import { EmojiIcon } from "../../core/design-system/components/EmojiIcon";
import { Field } from "../../core/design-system/components/Field";
import { List } from "../../core/design-system/components/List";
import { TextArea } from "../../core/design-system/components/TextArea";
import { TextInput } from "../../core/design-system/components/TextInput";
import { useBlockTemplates } from "../blocks/useBlockTemplates";
import { useAllNotes } from "../journals/useNotes";
import { useProjects } from "../projects/useProjects";
import { TaskList } from "../tasks/TaskList";
import { useTasks } from "../tasks/useTasks";
import { WorkspaceColorPicker } from "./WorkspaceColorPicker";
import type { Workspace } from "./workspaceApi";
import { useDeleteWorkspace, useUpdateWorkspace } from "./useWorkspaces";
import "./WorkspaceDetailPane.css";

type WorkspaceDetailPaneProps = {
  workspace: Workspace;
  onDeleted: () => void;
};

/** Shows and edits one workspace: title/description/color, then every task/project/note/block
 * template currently assigned to it (client-side filtered from the app's already-fetched lists —
 * see app/workspaces/CLAUDE.md for why this reads simpler than adding a backend ?workspaceId=
 * filter to four separate routes). A workspace is a collection lens, not an owning parent, so
 * deleting it (see useDeleteWorkspace) only ever unassigns these items, never deletes them.
 */
export function WorkspaceDetailPane({ workspace, onDeleted }: WorkspaceDetailPaneProps) {
  const updateWorkspace = useUpdateWorkspace();
  const deleteWorkspace = useDeleteWorkspace();
  const navigate = useNavigate();

  const { data: allTasks } = useTasks();
  const { data: allProjects } = useProjects();
  const { data: allNotes } = useAllNotes();
  const { data: allTemplates } = useBlockTemplates();

  const [title, setTitle] = useState(workspace.title);
  const [description, setDescription] = useState(workspace.description);
  const [color, setColor] = useState(workspace.color || "1");
  const [isArchived, setIsArchived] = useState(workspace.isArchived);

  useEffect(() => {
    setTitle(workspace.title);
    setDescription(workspace.description);
    setColor(workspace.color || "1");
    setIsArchived(workspace.isArchived);
  }, [workspace]);

  const tasks = (allTasks ?? []).filter((task) => task.workspaceId === workspace.id);
  const projects = (allProjects ?? []).filter((project) => project.workspaceId === workspace.id);
  const notes = (allNotes ?? []).filter((note) => note.workspaceId === workspace.id);
  const templates = (allTemplates ?? []).filter(
    (template) => template.workspaceId === workspace.id,
  );

  function handleSave() {
    updateWorkspace.mutate({
      workspaceId: workspace.id,
      changes: { title, description, color, isArchived },
    });
  }

  function handleDelete() {
    deleteWorkspace.mutate(workspace.id, { onSuccess: onDeleted });
  }

  return (
    <div className="cg-workspace-detail-pane">
      <Card>
        <TextInput
          className="cg-workspace-detail-pane__title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          aria-label="Title"
        />
        <Field label="Description">
          <TextArea
            rows={2}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
        <Field label="Color">
          <WorkspaceColorPicker value={color} onChange={setColor} />
        </Field>
      </Card>

      <Card>
        <h3>
          Projects ({projects.length}) <EmojiIcon symbol="📁" label="Projects" />
        </h3>
        <List
          groups={[{ key: "projects", items: projects }]}
          getId={(project) => project.id}
          getLabel={(project) => project.title}
          onSelect={(projectId) => navigate("/projects", { state: { projectId } })}
          emptyMessage="No projects in this workspace yet."
        />
      </Card>

      <Card>
        <h3>
          Tasks ({tasks.length}) <EmojiIcon symbol="✅" label="Tasks" />
        </h3>
        <TaskList
          tasks={tasks}
          capabilities={{ allowEdit: true }}
          onSelectTask={(taskId) =>
            navigate("/", { state: { selection: { kind: "task", id: taskId } } })
          }
          emptyMessage="No tasks in this workspace yet."
        />
      </Card>

      <Card>
        <h3>
          Blocks ({templates.length}) <EmojiIcon symbol="🧩" label="Blocks" />
        </h3>
        <List
          groups={[{ key: "blocks", items: templates }]}
          getId={(template) => template.id}
          getLabel={(template) => template.title}
          onSelect={(templateId) =>
            navigate("/", { state: { selection: { kind: "block-template", id: templateId } } })
          }
          emptyMessage="No blocks in this workspace yet."
        />
      </Card>

      <Card>
        <h3>
          Notes ({notes.length}) <EmojiIcon symbol="📝" label="Notes" />
        </h3>
        <ul className="cg-workspace-detail-pane__notes">
          {notes.length === 0 && (
            <p className="cg-workspace-detail-pane__notes-empty">No notes in this workspace yet.</p>
          )}
          {notes.map((note) => (
            <li className="cg-workspace-detail-pane__note" key={note.id}>
              {note.title && <p className="cg-workspace-detail-pane__note-title">{note.title}</p>}
              <p className="cg-workspace-detail-pane__note-content">{note.content}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h3>
          Settings <EmojiIcon symbol="⚙️" label="Settings" />
        </h3>
        <p className="cg-workspace-detail-pane__meta">
          Created {new Date(workspace.createdAt).toLocaleDateString()}
        </p>
        <CheckboxField
          label="Archived"
          checked={isArchived}
          onToggle={() => setIsArchived(!isArchived)}
        />
        <div className="cg-workspace-detail-pane__actions">
          <Button type="button" onClick={handleSave}>
            Save changes
          </Button>
          <Button type="button" variant="danger" onClick={handleDelete}>
            Delete workspace <BasicIcon name="trash" label="Delete" />
          </Button>
        </div>
        <p className="cg-workspace-detail-pane__delete-note">
          Deleting a workspace unassigns everything in it — nothing above is deleted.
        </p>
      </Card>
    </div>
  );
}
