// @manualReviewRequested: 2026-07-06
import { apiDelete, apiGet, apiPatch, apiPost } from "../../core/api/apiClient";

export type NoteTargetType = "" | "Task" | "Project";

export type Note = {
  id: string;
  title: string;
  content: string;
  journalDate: string | null;
  targetType: NoteTargetType;
  targetId: string;
  createdAt: string;
  effectiveDate: string;
};

export type CreateNoteInput = {
  title?: string;
  content?: string;
  journalDate?: string;
  targetType?: string;
  targetId?: string;
};

/** Reads pure journal entries (no task/project target), newest-created-first. */
export function fetchJournalEntries(): Promise<Note[]> {
  return apiGet<Note[]>("/api/notes?journalOnly=true");
}

/** Reads every note attached to one task or project, newest-created-first. */
export function fetchNotesForTarget(targetType: string, targetId: string): Promise<Note[]> {
  const query = `targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(targetId)}`;
  return apiGet<Note[]>(`/api/notes?${query}`);
}

/** Reads every note in the app — journal entries and task/project-attached notes alike — for
 * the "view all notes" page.
 */
export function fetchAllNotes(): Promise<Note[]> {
  return apiGet<Note[]>("/api/notes");
}

/** Creates a note — a plain journal entry, or one attached to a task/project if targetType/
 * targetId are given.
 */
export function createNote(input: CreateNoteInput): Promise<Note> {
  return apiPost<Note>("/api/notes", input);
}

/** Updates one or more of a note's fields. */
export function updateNote(noteId: string, changes: Partial<CreateNoteInput>): Promise<Note> {
  return apiPatch<Note>(`/api/notes/${noteId}`, changes);
}

/** Deletes a note. */
export function deleteNote(noteId: string): Promise<void> {
  return apiDelete(`/api/notes/${noteId}`);
}
