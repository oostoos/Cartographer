// @manualReviewRequested: 2026-07-06
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type CreateNoteInput,
  createNote,
  deleteNote,
  fetchAllNotes,
  fetchJournalEntries,
  fetchNotesForTarget,
  updateNote,
} from "./noteApi";

/** The shared prefix every notes query key is nested under, so any note mutation can invalidate
 * every view (journal entries, a target's notes, "all notes") with one invalidateQueries call —
 * TanStack Query matches query keys by prefix.
 */
const NOTES_QUERY_KEY = ["notes"];

/** Reads every pure journal entry (no task/project target), cached and refetched whenever any
 * note changes.
 */
export function useJournalEntries() {
  return useQuery({ queryKey: [...NOTES_QUERY_KEY, "journal"], queryFn: fetchJournalEntries });
}

/** Reads every note attached to one task or project. */
export function useNotesForTarget(targetType: string, targetId: string) {
  return useQuery({
    queryKey: [...NOTES_QUERY_KEY, "target", targetType, targetId],
    queryFn: () => fetchNotesForTarget(targetType, targetId),
  });
}

/** Reads every note in the app, for the "view all notes" page. */
export function useAllNotes() {
  return useQuery({ queryKey: [...NOTES_QUERY_KEY, "all"], queryFn: fetchAllNotes });
}

/** Creates a note, then refreshes every notes view. */
export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateNoteInput) => createNote(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY }),
  });
}

/** Updates a note's fields, then refreshes every notes view. */
export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, changes }: { noteId: string; changes: Partial<CreateNoteInput> }) =>
      updateNote(noteId, changes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY }),
  });
}

/** Deletes a note, then refreshes every notes view. */
export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => deleteNote(noteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY }),
  });
}
