// @manualReviewRequested: 2026-07-06
import { type FormEvent, useState } from "react";

import { BasicIcon } from "../../core/design-system/components/BasicIcon";
import { Button } from "../../core/design-system/components/Button";
import { EmojiIcon } from "../../core/design-system/components/EmojiIcon";
import { Field } from "../../core/design-system/components/Field";
import { List } from "../../core/design-system/components/List";
import { ModalButton } from "../../core/design-system/components/ModalButton";
import { TextArea } from "../../core/design-system/components/TextArea";
import { TextInput } from "../../core/design-system/components/TextInput";
import type { Note } from "./noteApi";
import { useCreateNote, useNotesForTarget } from "./useNotes";
import "./NotesSection.css";

const RECENT_NOTES_LIMIT = 3;

type NotesSectionProps = {
  targetType: "Task" | "Project";
  targetId: string;
};

/** The collapsed "Notes" section embedded in a task/project's detail pane: its few most recent
 * ad-hoc notes plus an "Add note" modal. The full, day-grouped history across every task and
 * project lives in the calendar page's right-sidebar notes feed (app/journals/NotesFeed.tsx).
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
          icon={<BasicIcon name="plus" label="Add note" />}
          renderContent={(close) => (
            <NoteCreateForm
              onCreate={(input) =>
                createNote.mutate({ ...input, targetType, targetId }, { onSuccess: close })
              }
            />
          )}
        />
      </div>
      <List
        groups={[{ key: "recent-notes", items: recentNotes }]}
        getId={(note) => note.id}
        getLabel={(note: Note) => note.content}
        renderItemLabel={(note: Note) => (
          <>
            {note.title && <p className="cg-notes-section__note-title">{note.title}</p>}
            <p className="cg-notes-section__note-content">{note.content}</p>
          </>
        )}
        emptyMessage="No notes yet."
      />
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
      <Field label="Title">
        <TextInput value={title} onChange={(event) => setTitle(event.target.value)} />
      </Field>
      <Field label="Note">
        <TextArea rows={4} value={content} onChange={(event) => setContent(event.target.value)} />
      </Field>
      <Button type="submit">
        Add note <EmojiIcon symbol="➕" label="Add" />
      </Button>
    </form>
  );
}
