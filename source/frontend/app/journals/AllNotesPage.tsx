import { Card } from "../../core/design-system/components/Card";
import { EmojiIcon } from "../../core/design-system/components/EmojiIcon";
import { useProjects } from "../projects/useProjects";
import { useTasks } from "../tasks/useTasks";
import type { Note } from "./noteApi";
import { useAllNotes } from "./useNotes";
import "./AllNotesPage.css";

function groupNotesByDate(notes: Note[]): Map<string, Note[]> {
  const byDate = new Map<string, Note[]>();
  for (const note of notes) {
    const existing = byDate.get(note.effectiveDate) ?? [];
    existing.push(note);
    byDate.set(note.effectiveDate, existing);
  }
  return byDate;
}

/** The "view all notes" page — reached from a task or project's NotesSection, not the top nav.
 * Every note in the app (journal entries and task/project-attached notes alike), grouped by
 * day, newest day first, with each attached note labeled with the task/project it belongs to.
 */
export function AllNotesPage() {
  const { data: notes, isLoading, isError } = useAllNotes();
  const { data: tasks } = useTasks();
  const { data: projects } = useProjects();

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

  const notesByDate = groupNotesByDate(notes);
  const sortedDates = [...notesByDate.keys()].sort((a, b) => b.localeCompare(a));

  return (
    <div className="cg-all-notes-page">
      <h1>
        All notes <EmojiIcon symbol="🗒️" label="Notes" />
      </h1>
      {sortedDates.length === 0 && <p>No notes yet.</p>}
      {sortedDates.map((date) => (
        <Card key={date} className="cg-all-notes-page__day">
          <h2>{date}</h2>
          {notesByDate.get(date)?.map((note) => {
            const label = targetLabel(note);
            return (
              <div className="cg-all-notes-page__note" key={note.id}>
                {label && <p className="cg-all-notes-page__note-target">{label}</p>}
                {note.title && <p className="cg-all-notes-page__note-title">{note.title}</p>}
                <p className="cg-all-notes-page__note-content">{note.content}</p>
              </div>
            );
          })}
        </Card>
      ))}
    </div>
  );
}
