import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "../../core/design-system/components/Button";
import { EmojiIcon } from "../../core/design-system/components/EmojiIcon";
import { ModalButton } from "../../core/design-system/components/ModalButton";
import { TextArea } from "../../core/design-system/components/TextArea";
import { TextInput } from "../../core/design-system/components/TextInput";
import { useCreateNote, useNotesForTarget } from "./useNotes";
import "./NotesSection.css";

const RECENT_NOTES_LIMIT = 3;

type NotesSectionProps = {
  targetType: "Task" | "Project";
  targetId: string;
};

/** The collapsed "Notes" section embedded in a task/project's detail pane: its few most recent
 * ad-hoc notes, an "Add note" modal, and a link to the "view all notes" page for the full,
 * day-grouped history across every task and project.
 */
export function NotesSection({ targetType, targetId }: NotesSectionProps) {
  const { data: notes } = useNotesForTarget(targetType, targetId);
  const createNote = useCreateNote();

  const recentNotes = (notes ?? []).slice(0, RECENT_NOTES_LIMIT);

  return (
    <div className="cg-notes-section">
      <div className="cg-notes-section__header">
        <h3>
          Notes <EmojiIcon symbol="🗒️" label="Notes" />
        </h3>
        <ModalButton
          label="Add note"
          icon={{ symbol: "➕", label: "Add note" }}
          renderContent={(close) => (
            <NoteCreateForm
              onCreate={(input) =>
                createNote.mutate({ ...input, targetType, targetId }, { onSuccess: close })
              }
            />
          )}
        />
      </div>
      {recentNotes.length === 0 && <p>No notes yet.</p>}
      {recentNotes.map((note) => (
        <div className="cg-notes-section__note" key={note.id}>
          {note.title && <p className="cg-notes-section__note-title">{note.title}</p>}
          <p className="cg-notes-section__note-content">{note.content}</p>
        </div>
      ))}
      <Link to="/notes" className="cg-notes-section__view-all">
        View all notes
      </Link>
    </div>
  );
}

type NoteCreateFormProps = {
  onCreate: (input: { title?: string; content?: string }) => void;
};

function NoteCreateForm({ onCreate }: NoteCreateFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!content.trim()) return;
    onCreate({ title, content });
  }

  return (
    <form className="cg-note-create-form" onSubmit={handleSubmit}>
      <label className="cg-note-create-form__field">
        Title
        <TextInput value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label className="cg-note-create-form__field">
        Note
        <TextArea rows={4} value={content} onChange={(event) => setContent(event.target.value)} />
      </label>
      <Button type="submit">
        Add note <EmojiIcon symbol="➕" label="Add" />
      </Button>
    </form>
  );
}
