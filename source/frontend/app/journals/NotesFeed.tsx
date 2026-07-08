// @manualReviewRequested: 2026-07-07
import { Fragment, useEffect, useRef } from "react";

import { Card } from "../../core/design-system/components/Card";
import { useProjects } from "../projects/useProjects";
import { useTasks } from "../tasks/useTasks";
import type { Note } from "./noteApi";
import { formatDateSeparator, formatNoteTime } from "./noteFormat";
import { groupNotesByDate } from "./noteGrouping";
import { useAllNotes } from "./useNotes";
import "./NotesFeed.css";

/** The calendar page's right-sidebar Notes feed: every note in the app — plain journal entries
 * and task/project-attached notes alike, the same Note record shape (see app/journals/note.py) —
 * one card per note, oldest first both across days and within a day (groupNotesByDate already
 * returns them in that order; this just renders each note as its own card instead of one card per
 * day), so the newest note always sits just above the composer pinned below this feed. The feed
 * scrolls itself to that newest note on mount and whenever the note list changes. A lightweight
 * date separator, not a card, appears once each time the feed reaches a new calendar date.
 * Replaces the old separate Journal tab and "view all notes" page: notes and journaling are now
 * one and the same thing (see app/journals/CLAUDE.md). A note attached to a task or project is
 * labeled with that task's/project's title; a plain journal entry isn't labeled at all.
 */
export function NotesFeed() {
  const { data: notes, isLoading, isError } = useAllNotes();
  const { data: tasks } = useTasks();
  const { data: projects } = useProjects();
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const feed = feedRef.current;
    if (feed) feed.scrollTop = feed.scrollHeight;
  }, [notes]);

  if (isLoading) return <p>Loading notes…</p>;
  if (isError || !notes) return <p>Couldn't load notes.</p>;

  const taskTitleById = new Map((tasks ?? []).map((task) => [task.id, task.title]));
  const projectTitleById = new Map((projects ?? []).map((project) => [project.id, project.title]));

  function targetLabel(note: Note): string | null {
    if (note.targetType === "Task") return taskTitleById.get(note.targetId) ?? "a deleted task";
    if (note.targetType === "Project") {
      return projectTitleById.get(note.targetId) ?? "a deleted project";
    }
    return null;
  }

  const groups = groupNotesByDate(notes);

  return (
    <div className="cg-notes-feed" ref={feedRef}>
      {groups.length === 0 && <p>No notes yet.</p>}
      {groups.map(({ date, notes: dayNotes }) => (
        <Fragment key={date}>
          <p className="cg-notes-feed__date-separator">{formatDateSeparator(date)}</p>
          {dayNotes.map((note) => {
            const label = targetLabel(note);
            return (
              <Card key={note.id} className="cg-notes-feed__note-card">
                <div className="cg-notes-feed__note-header">
                  {label && <span className="cg-notes-feed__note-target">{label}</span>}
                  <span className="cg-notes-feed__note-time">{formatNoteTime(note.createdAt)}</span>
                </div>
                {note.title && <p className="cg-notes-feed__note-title">{note.title}</p>}
                <p className="cg-notes-feed__note-content">{note.content}</p>
              </Card>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}
