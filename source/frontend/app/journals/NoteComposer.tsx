// @manualReviewRequested: 2026-07-07
import { type FormEvent, type KeyboardEvent, useState } from "react";

import { BasicIcon } from "../../core/design-system/components/BasicIcon";
import { Button } from "../../core/design-system/components/Button";
import { Select } from "../../core/design-system/components/Select";
import { TextArea } from "../../core/design-system/components/TextArea";
import { TextInput } from "../../core/design-system/components/TextInput";
import { todayIsoDate } from "../../core/utils/date";
import { useWorkspaces } from "../workspaces/useWorkspaces";
import { useCreateNote } from "./useNotes";
import "./NoteComposer.css";

const NO_WORKSPACE_VALUE = "";

/** How many rows the note body starts at — enough to see a few lines while composing without
 * growing the sidebar unreasonably.
 */
const CONTENT_ROWS = 3;

/** The calendar page's bottom-of-sidebar note composer — a chat-prompt-style "type and send" box
 * always available, no matter what's selected elsewhere on the page: an optional title plus
 * content, submitted as a plain journal-dated note (no task/project target — see
 * app/journals/note.py). Replaces the old JournalingCard; a note can still be attached to a
 * specific task or project from that task's/project's own NotesSection instead.
 */
export function NoteComposer() {
  const createNote = useCreateNote();
  const { data: workspaces } = useWorkspaces();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [workspaceId, setWorkspaceId] = useState(NO_WORKSPACE_VALUE);

  function submitNote() {
    if (!content.trim()) return;
    createNote.mutate(
      { title, content, journalDate: todayIsoDate(), workspaceId },
      {
        onSuccess: () => {
          setTitle("");
          setContent("");
        },
      },
    );
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submitNote();
  }

  function handleContentKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      submitNote();
    }
  }

  return (
    <form className="cg-note-composer" onSubmit={handleSubmit}>
      <TextInput
        className="cg-note-composer__title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Title (optional)"
        aria-label="Note title"
      />
      <TextArea
        className="cg-note-composer__content"
        rows={CONTENT_ROWS}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={handleContentKeyDown}
        placeholder="Jot something down…"
        aria-label="Note content"
      />
      <div className="cg-note-composer__actions">
        {(workspaces?.length ?? 0) > 0 && (
          <Select
            className="cg-note-composer__workspace"
            value={workspaceId}
            onChange={setWorkspaceId}
            options={[
              { value: NO_WORKSPACE_VALUE, label: "No workspace" },
              ...(workspaces ?? []).map((workspace) => ({
                value: workspace.id,
                label: workspace.title,
              })),
            ]}
            aria-label="Note workspace"
          />
        )}
        <Button type="submit">
          Add <BasicIcon name="plus" label="Add note" />
        </Button>
      </div>
      {createNote.isError && <p className="cg-note-composer__error">{createNote.error.message}</p>}
    </form>
  );
}
