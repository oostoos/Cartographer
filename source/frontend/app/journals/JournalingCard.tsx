// @manualReviewRequested: 2026-07-06
import { type FormEvent, useState } from "react";

import { Button } from "../../core/design-system/components/Button";
import { Card } from "../../core/design-system/components/Card";
import { EmojiIcon } from "../../core/design-system/components/EmojiIcon";
import { TextArea } from "../../core/design-system/components/TextArea";
import { todayIsoDate } from "../../core/utils/date";
import { useCreateNote } from "./useNotes";
import "./JournalingCard.css";

/** The Today page's "write a journal entry" card — front and center, so jotting down a thought
 * is always one click away. A user can add as many entries a day as they like; each becomes its
 * own Note with today's date, viewable later on the Journal tab.
 */
export function JournalingCard() {
  const createNote = useCreateNote();
  const [content, setContent] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!content.trim()) return;
    createNote.mutate(
      { content, journalDate: todayIsoDate() },
      { onSuccess: () => setContent("") },
    );
  }

  return (
    <Card className="cg-journaling-card">
      <h2>
        Journal <EmojiIcon symbol="📔" label="Journal" />
      </h2>
      <form onSubmit={handleSubmit}>
        <TextArea
          rows={3}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="What's on your mind?"
        />
        <Button type="submit">
          Add entry <EmojiIcon symbol="➕" label="Add" />
        </Button>
      </form>
      {createNote.isError && (
        <p className="cg-journaling-card__error">{createNote.error.message}</p>
      )}
    </Card>
  );
}
